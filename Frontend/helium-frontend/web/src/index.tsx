import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
// Removed bootstrap imports. Tailwind CSS is used instead.
import './index.css';

fetch('/appsettings.json')
  .then(response => response.json())
  .then((settings: { apiBaseUrl: string }) => {
    const apiBaseUrl = settings.apiBaseUrl;

    return fetch(`${apiBaseUrl}/api/health`)
      .then(response => {
        if (response.ok) {
          console.log(`🚀 Helium App | Frontend running at ${window.location.origin}`);
          console.log(`🚀 Helium App | Backend connected at ${apiBaseUrl}`);
        }
      })
      .catch(() => {
        console.log(`🚀 Helium App | Frontend running at ${window.location.origin}`);
        console.log(`⚠️ Helium App | Backend not reachable at ${apiBaseUrl}`);
      });
  })
  .catch(() => {
    console.log(`🚀 Helium App | Frontend running at ${window.location.origin}`);
    console.log('⚠️ Helium App | Could not load appsettings.json');
  });

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
