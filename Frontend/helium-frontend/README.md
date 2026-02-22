# Helium Project

Welcome to the Helium project! This repository contains both a mobile application built with Flutter and a web application built with React and Tailwind CSS.

## Project Structure

The project is organized into two main directories:

- **mobile**: Contains the Flutter application targeting Android and iOS.
  - **android**: Android-specific files for the Flutter application.
  - **ios**: iOS-specific files for the Flutter application.
  - **lib**: Contains the Dart code for the Flutter application.
    - **main.dart**: Entry point of the Flutter application.
    - **src**: Contains the core, UI, and model components of the application.
      - **core**: Dependency injection and service management.
      - **ui**: UI components including screens and widgets.
      - **models**: Data models used in the application.
  - **test**: Contains widget tests for the Flutter application.
  - **pubspec.yaml**: Configuration file for the Flutter project.
  - **analysis_options.yaml**: Dart analysis options for code quality.
  - **README.md**: Documentation specific to the mobile application.

- **web**: Contains the React application for web browser support.
  - **src**: Contains the TypeScript code for the React application.
    - **index.tsx**: Entry point for the React application and initial backend health check.
    - **App.tsx**: Main application component and routing.
    - **pages**: Page components for the application.
      - **HomePage.tsx**: Simple landing page.
      - **LoginPage.tsx**: Login form calling the backend `/api/auth/login` endpoint.
      - **SignupPage.tsx**: Registration form calling the backend `/api/auth/register` endpoint.
    - **index.css**: Global CSS styles including Tailwind CSS directives.
  - **public**: Contains static files like `index.html` and `appsettings.json`.
  - **package.json**: Configuration file for npm.
  - **tsconfig.json**: TypeScript configuration file.
  - **tailwind.config.js**: Configuration file for Tailwind CSS.
  - **postcss.config.js**: Configuration file for PostCSS.
  - **README.md**: Documentation specific to the web application.

## Getting Started

To get started with the Helium project, follow these steps:

### Mobile Application

1. Navigate to the `mobile` directory.
2. Run `flutter pub get` to install the dependencies.
3. Use `flutter run` to launch the application on an emulator or physical device.

### Web Application

1. Navigate to the `web` directory:
  - `cd Frontend/helium-frontend/web`
2. Install dependencies:
  - `npm install`
3. Configure the backend URL used by the frontend:
  - Edit `public/appsettings.json` and set `apiBaseUrl` to your backend URL, for example:
    - `{ "apiBaseUrl": "http://localhost:5297" }`
4. Start the web application:
  - `npm start`
5. The app runs on `http://localhost:3000` and calls the backend using the URL from `appsettings.json`.

## Frontend Updates

- The web app uses **Tailwind CSS only** for styling; Bootstrap has been removed.
- The registration form now includes First Name, Last Name, Email, Password, Confirm Password, and Preferred Currency fields to match the backend `RegisterRequestDto`.
- Password requirements are enforced: minimum 8 characters, at least one uppercase, one lowercase, one digit, and one special character, with live feedback.
- A confirm password field ensures the password and confirmation match before submission.
- The frontend reads the backend URL from `public/appsettings.json` and sends all API requests (login/register) through that base URL.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.