import 'package:flutter/material.dart';
import 'auth_manager.dart';

/// Google/Appleログインボタン
class OAuthButtons extends StatelessWidget {
  final AuthManager authManager;

  const OAuthButtons({super.key, required this.authManager});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () => authManager.signInWithGoogle(),
            icon: const Text('G', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            label: const Text('Googleでログイン'),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              foregroundColor: Colors.black87,
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: () => authManager.signInWithApple(),
            icon: const Icon(Icons.apple, size: 22),
            label: const Text('Appleでログイン'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ),
      ],
    );
  }
}
