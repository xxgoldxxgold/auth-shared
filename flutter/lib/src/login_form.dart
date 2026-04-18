import 'package:flutter/material.dart';
import 'auth_manager.dart';
import 'oauth_buttons.dart';

/// 共通ログインフォーム（メール/パスワード + OAuth）
class LoginForm extends StatefulWidget {
  final AuthManager authManager;
  final VoidCallback? onSuccess;

  const LoginForm({super.key, required this.authManager, this.onSuccess});

  @override
  State<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<LoginForm> {
  String _mode = 'login'; // login, register, reset
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  String? _error;
  String? _message;
  bool _loading = false;

  Future<void> _handleSubmit() async {
    setState(() { _error = null; _message = null; _loading = true; });

    String? result;
    if (_mode == 'login') {
      result = await widget.authManager.signInWithEmail(
        _emailController.text, _passwordController.text,
      );
      if (result == null) widget.onSuccess?.call();
    } else if (_mode == 'register') {
      result = await widget.authManager.signUpWithEmail(
        _emailController.text, _passwordController.text,
        name: _nameController.text.isNotEmpty ? _nameController.text : null,
      );
      if (result == null) _message = '確認メールを送信しました';
    } else {
      result = await widget.authManager.resetPassword(_emailController.text);
      if (result == null) _message = 'リセットメールを送信しました';
    }

    setState(() { _error = result; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            _mode == 'login' ? 'ログイン' : _mode == 'register' ? '新規登録' : 'パスワードリセット',
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),
          OAuthButtons(authManager: widget.authManager),
          const SizedBox(height: 20),
          if (_mode == 'register')
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: '表示名', border: OutlineInputBorder()),
            ),
          if (_mode == 'register') const SizedBox(height: 12),
          TextField(
            controller: _emailController,
            decoration: const InputDecoration(labelText: 'メールアドレス', border: OutlineInputBorder()),
            keyboardType: TextInputType.emailAddress,
          ),
          if (_mode != 'reset') ...[
            const SizedBox(height: 12),
            TextField(
              controller: _passwordController,
              decoration: const InputDecoration(labelText: 'パスワード', border: OutlineInputBorder()),
              obscureText: true,
            ),
          ],
          if (_error != null) Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
          ),
          if (_message != null) Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(_message!, style: const TextStyle(color: Colors.green, fontSize: 13)),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _loading ? null : _handleSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black, foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: _loading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Text(_mode == 'login' ? 'ログイン' : _mode == 'register' ? '登録' : 'リセットメール送信'),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (_mode != 'login')
                TextButton(onPressed: () => setState(() { _mode = 'login'; _error = null; _message = null; }),
                    child: const Text('ログインに戻る')),
              if (_mode == 'login') ...[
                TextButton(onPressed: () => setState(() { _mode = 'register'; _error = null; _message = null; }),
                    child: const Text('新規登録')),
                TextButton(onPressed: () => setState(() { _mode = 'reset'; _error = null; _message = null; }),
                    child: const Text('パスワードを忘れた方')),
              ],
            ],
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    super.dispose();
  }
}
