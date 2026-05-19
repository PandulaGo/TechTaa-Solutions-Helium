# Helium Frontend

This folder contains the frontend applications for the Helium project:

- A web application built with **React**, **TypeScript**, and **Tailwind CSS**.
- A mobile application built with **Flutter** (project scaffolded; app code to be added).

Both frontends communicate with the Helium backend (ASP.NET Core Web API) via REST endpoints.

## High-Level Frontend–Backend Architecture

```mermaid
graph LR
    subgraph Clients
        Web[Web App (React, TS, Tailwind)]
        Mobile[Mobile App (Flutter)]
    end

    Web -->|HTTPS/JSON| Api[Helium.Api
        /api/auth, /api/vehicles,
        /api/fuel-entries, /api/charging-entries,
        /api/maintenance-records, /api/reports,
        /api/files]

    Mobile -->|Future integration| Api

    Api --> App[Helium.Application]
    App --> Infra[Helium.Infrastructure]
    Infra --> Db[(SQL Server)]
    Infra --> Storage[(File Storage)]
```

## Project Structure

The frontend is organized into two main directories:

- **mobile**: Flutter mobile application targeting Android and iOS.
  - **android/**: Android-specific files for the Flutter application.
  - **ios/**: iOS-specific files for the Flutter application.
  - **pubspec.yaml**: Configuration file for the Flutter project.
  - **analysis_options.yaml**: Dart analysis options for code quality.
  - **test/**: Directory for Flutter tests.
  - Application source (for example a `lib/` folder with `main.dart` and feature code) will live here as the mobile app is implemented.

- **web**: React web application.
  - **src/**: TypeScript source for the React application.
    - **index.tsx**: Entry point for the React application and initial backend health check.
    - **App.tsx**: Main application component and routing.
    - **pages/**: Page components for the application.
      - **HomePage.tsx**: Landing page.
      - **LoginPage.tsx**: Login form calling the backend `/api/auth/login` endpoint.
      - **SignupPage.tsx**: Registration form calling the backend `/api/auth/register` endpoint.
    - **index.css**: Global CSS styles including Tailwind CSS directives.
  - **public/**: Static files such as `index.html` and `appsettings.json`.
  - **package.json**: npm configuration.
  - **tsconfig.json**: TypeScript configuration.
  - **tailwind.config.js**: Tailwind CSS configuration.
  - **postcss.config.js**: PostCSS configuration.

## Getting Started

### Mobile Application (Flutter)

1. Navigate to the `mobile` directory:
   - `cd Frontend/helium-frontend/mobile`
2. Run `flutter pub get` to install dependencies.
3. Implement or update the Flutter application code under the mobile project (for example in a `lib/` folder) as needed.
4. Use `flutter run` to launch the application on an emulator or physical device.

### Web Application (React)

1. Navigate to the `web` directory:
   - `cd Frontend/helium-frontend/web`
2. Install dependencies:
   - `npm install`
3. Configure the backend URL used by the frontend:
   - Edit `public/appsettings.json` and set `apiBaseUrl` to your backend URL, for example:
     - `{ "apiBaseUrl": "http://localhost:10011" }`
4. Start the web application:
   - `npm start`
5. The app runs on `http://localhost:10015` and calls the backend using the URL from `appsettings.json`.

## Frontend Updates

- The web app uses **Tailwind CSS only** for styling; Bootstrap has been removed.
- The registration form includes First Name, Last Name, Email, Password, Confirm Password, and Preferred Currency fields to match the backend `RegisterRequestDto`.
- Password requirements are enforced: minimum 8 characters, at least one uppercase, one lowercase, one digit, and one special character, with live feedback.
- A confirm password field ensures the password and confirmation match before submission.
- The web frontend reads the backend URL from `public/appsettings.json` and sends all API requests (login/register) through that base URL.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.