# Helium Mobile Application

This directory contains the Flutter mobile application for the Helium project. The application is designed to run on both Android and iOS platforms and will communicate with the Helium backend via REST APIs as the app features are implemented.

## Architecture Overview

```mermaid
graph TD
    User[Mobile User] --> App[Helium Mobile App (Flutter)]
    App -->|Future integration| Api[Helium.Api (ASP.NET Core)]
    Api --> BackendServices[Auth, Vehicles, Entries, Maintenance, Reports]
```

## Project Structure (Current)

- **android/**: Android-specific files for the Flutter application.
- **ios/**: iOS-specific files for the Flutter application.
- **pubspec.yaml**: Configuration file for the Flutter project, listing dependencies and assets.
- **analysis_options.yaml**: Analysis options for Dart code quality.
- **test/**: Directory for Flutter widget/unit tests.

As the mobile app is developed, the main application code (for example a `lib/` folder with `main.dart`, screens, and models) will be added here.

## Getting Started

To work with the mobile application, ensure you have Flutter installed on your machine, then:

1. Clone the repository.
2. Navigate to the `mobile` directory:
   - `cd Frontend/helium-frontend/mobile`
3. Run `flutter pub get` to install dependencies.
4. Add or update your Flutter source code (for example under a `lib/` folder).
5. Use `flutter run` to launch the application on an emulator or physical device.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.