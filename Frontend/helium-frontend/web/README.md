# Helium Frontend Web Application

This is the web frontend for the Helium application, built using React and styled with Tailwind CSS.

## Project Structure

- `src/`: Contains the source code for the React application.
  - `main.tsx`: The entry point for the React application.
  - `App.tsx`: The main application component that sets up routing and layout.
  - `components/`: Contains reusable components.
    - `PrimaryButton.tsx`: A customizable button component styled with Tailwind CSS.
  - `pages/`: Contains the different pages of the application.
    - `HomePage.tsx`: The home page of the web application.
  - `index.css`: Global CSS styles, including Tailwind CSS imports.

- `public/`: Contains static files.
  - `index.html`: The main HTML file for the React application.

## Getting Started

To get started with the web application, follow these steps:

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd helium-frontend/web
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

3. **Run the application**:
   ```
   npm start
   ```

The application will be available at `http://localhost:3000`.

## Tailwind CSS

This project uses Tailwind CSS for styling. You can customize the styles in the `tailwind.config.js` file.

## Contributing

If you would like to contribute to this project, please fork the repository and submit a pull request. 

## License

This project is licensed under the MIT License. See the LICENSE file for details.