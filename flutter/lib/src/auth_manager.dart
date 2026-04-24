import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// 全サービス共通の認証マネージャー
///
/// [redirectUrl] は OAuth 後の deep-link URL。必ず Supabase Dashboard の
/// Redirect URLs に登録されている値を渡すこと。例: `com.example.myapp://login-callback`
class AuthManager extends ChangeNotifier {
  final SupabaseClient _supabase;
  final String _redirectUrl;
  final String? _signupSource;
  final String? _deleteUserFunctionName;
  User? _user;
  String _displayName = '';
  String _avatarUrl = '';
  bool _isLoading = true;

  User? get user => _user;
  String get displayName => _displayName;
  String get avatarUrl => _avatarUrl;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;

  AuthManager({
    required SupabaseClient supabase,
    required String redirectUrl,
    String? signupSource,
    String? deleteUserFunctionName,
  })  : _supabase = supabase,
        _redirectUrl = redirectUrl,
        _signupSource = signupSource,
        _deleteUserFunctionName = deleteUserFunctionName {
    _initialize();
  }

  Future<void> _initialize() async {
    final session = _supabase.auth.currentSession;
    if (session != null) {
      _user = session.user;
      await loadProfile(session.user.id);
    }
    _isLoading = false;
    notifyListeners();

    _supabase.auth.onAuthStateChange.listen((data) async {
      _user = data.session?.user;
      if (_user != null) {
        await loadProfile(_user!.id);
      } else {
        _displayName = '';
        _avatarUrl = '';
      }
      notifyListeners();
    });
  }

  Future<void> loadProfile(String userId) async {
    try {
      final data = await _supabase
          .from('shared_profiles')
          .select('display_name, avatar_url')
          .eq('id', userId)
          .single();
      _displayName = data['display_name'] ?? '';
      _avatarUrl = data['avatar_url'] ?? '';
    } catch (_) {
      _displayName = '';
      _avatarUrl = '';
    }
    notifyListeners();
  }

  Future<String?> signInWithEmail(String email, String password) async {
    try {
      await _supabase.auth.signInWithPassword(email: email, password: password);
      return null;
    } on AuthException catch (e) {
      return e.message;
    }
  }

  Future<String?> signUpWithEmail(String email, String password, {String? name}) async {
    try {
      await _supabase.auth.signUp(
        email: email,
        password: password,
        data: name != null ? {'display_name': name} : null,
      );
      return null;
    } on AuthException catch (e) {
      return e.message;
    }
  }

  Future<String?> resetPassword(String email) async {
    try {
      await _supabase.auth.resetPasswordForEmail(email);
      return null;
    } on AuthException catch (e) {
      return e.message;
    }
  }

  Future<void> signInWithGoogle() async {
    try {
      final launched = await _supabase.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: _redirectUrl,
      );
      if (!launched) {
        throw AuthException('Failed to launch Google OAuth browser');
      }
    } catch (e, st) {
      debugPrint('[auth-shared] signInWithGoogle error: $e\n$st');
      rethrow;
    }
  }

  Future<void> signInWithApple() async {
    try {
      final launched = await _supabase.auth.signInWithOAuth(
        OAuthProvider.apple,
        redirectTo: _redirectUrl,
      );
      if (!launched) {
        throw AuthException('Failed to launch Apple OAuth browser');
      }
    } catch (e, st) {
      debugPrint('[auth-shared] signInWithApple error: $e\n$st');
      rethrow;
    }
  }

  Future<void> signOut() async {
    await _supabase.auth.signOut();
    _user = null;
    _displayName = '';
    _avatarUrl = '';
    notifyListeners();
  }

  /// このアプリだけの退会 (opt-out)。
  /// 成功時: Edge Function 呼び出し後に signOut して null を返す。
  /// 失敗時: エラーメッセージを返す (signOut しない)。auth.users は触らない。
  Future<String?> deleteAccount() async {
    final fnName = _deleteUserFunctionName
        ?? (_signupSource != null ? 'delete-$_signupSource-user' : null);
    if (fnName == null) {
      return 'auth-shared: deleteAccount requires signupSource or deleteUserFunctionName';
    }
    final session = _supabase.auth.currentSession;
    if (session == null) return 'not_authenticated';
    try {
      final response = await _supabase.functions.invoke(fnName);
      if (response.status != null && response.status! >= 400) {
        final data = response.data;
        if (data is Map && data['error'] is String) return data['error'] as String;
        return 'http_${response.status}';
      }
      await signOut();
      return null;
    } on FunctionException catch (e) {
      final details = e.details;
      if (details is Map && details['error'] is String) return details['error'] as String;
      return 'http_${e.status}';
    } catch (e) {
      return e.toString();
    }
  }
}
