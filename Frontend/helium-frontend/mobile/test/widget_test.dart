import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:helium_frontend/src/ui/screens/home_screen.dart';

void main() {
  testWidgets('HomeScreen has a title and a button', (WidgetTester tester) async {
    await tester.pumpWidget(MaterialApp(home: HomeScreen()));

    final titleFinder = find.text('Home');
    final buttonFinder = find.byType(ElevatedButton);

    expect(titleFinder, findsOneWidget);
    expect(buttonFinder, findsOneWidget);
  });
}