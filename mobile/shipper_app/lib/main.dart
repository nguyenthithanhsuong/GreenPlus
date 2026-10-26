import 'package:flutter/material.dart';

void main() => runApp(const GreenPlusApp());

class GreenPlusApp extends StatelessWidget {
  const GreenPlusApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'GreenPlus Shipper', debugShowCheckedModeBanner: false,
    theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF15A651)), useMaterial3: true),
    home: const HomeScreen(),
  );
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('GreenPlus Shipper'),backgroundColor: const Color(0xFF15A651),foregroundColor: Colors.white),
    body: SafeArea(child: Padding(padding: const EdgeInsets.all(24),child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,mainAxisAlignment: MainAxisAlignment.center,
      children: [const Icon(Icons.eco, size: 64, color: Color(0xFF15A651)),
        const SizedBox(height: 24),const Text('Đơn được phân công • Giao hàng • Đối soát COD',style: TextStyle(fontSize: 22,fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),const Text('Khung ứng dụng v2.0. Chưa kết nối hệ thống xác thực hoặc API thực tế.'),
      ]))),
  );
}
