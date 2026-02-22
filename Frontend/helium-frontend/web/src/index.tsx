import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
// Removed bootstrap imports. Tailwind CSS is used instead.
import './index.css';

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:5297';

fetch(`${apiBaseUrl}/api/health`)
  .then(response => {
    if (response.ok) {
      // Backend is reachable; print hello in the web console
      console.log('hello');
    }
  })
  .catch(() => {
    // Ignore errors here; backend might not be up yet
  });

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
