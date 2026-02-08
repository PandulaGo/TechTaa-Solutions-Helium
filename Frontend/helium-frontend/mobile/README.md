# Mobile Application

This directory contains the Flutter mobile application for the Helium project. The application is designed to run on both Android and iOS platforms.

## Project Structure

- **android/**: Contains Android-specific files for the Flutter application.
- **ios/**: Contains iOS-specific files for the Flutter application.
- **lib/**: Contains the main application code.
  - **main.dart**: Entry point of the Flutter application.
  - **src/**: Contains the source code organized into core, UI, and models.
    - **core/**: Contains dependency management files.
    - **ui/**: Contains UI components, screens, and widgets.
    - **models/**: Contains data models used in the application.
- **test/**: Contains widget tests for the application.
- **pubspec.yaml**: Configuration file for the Flutter project, listing dependencies and assets.
- **analysis_options.yaml**: Contains analysis options for Dart code quality.
- **README.md**: Documentation specific to the mobile application.

## Getting Started

To run the mobile application, ensure you have Flutter installed on your machine. Follow these steps:

1. Clone the repository.
2. Navigate to the `mobile` directory.
3. Run `flutter pub get` to install dependencies.
4. Use `flutter run` to launch the application on an emulator or physical device.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.