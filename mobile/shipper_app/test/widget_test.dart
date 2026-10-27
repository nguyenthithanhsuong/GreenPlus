import 'package:flutter_test/flutter_test.dart';
import '../lib/main.dart';
void main() { testWidgets('starter renders GreenPlus', (tester) async {
 await tester.pumpWidget(const GreenPlusApp());
 expect(find.textContaining('GreenPlus'), findsWidgets);
}); }
