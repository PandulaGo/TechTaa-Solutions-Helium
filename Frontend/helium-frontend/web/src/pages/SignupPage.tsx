import React, { useState } from 'react';
import axios from 'axios';

const SignupPage: React.FC = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', preferredCurrency: 'USD' });
  const [error, setError] = useState('');
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    digit: false,
    special: false
  });
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = React.useState('');

  React.useEffect(() => {
    fetch('/appsettings.json')
      .then(res => res.json())
      .then(config => setApiBaseUrl(config.apiBaseUrl));
  }, []);

  const validate = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.confirmPassword || !form.preferredCurrency) {
      setError('All fields are required.');
      return false;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setError('Invalid email format.');
      return false;
    }
    // Password requirements
    const requirements = {
      length: form.password.length >= 8,
      uppercase: /[A-Z]/.test(form.password),
      lowercase: /[a-z]/.test(form.password),
      digit: /[0-9]/.test(form.password),
      special: /[^A-Za-z0-9]/.test(form.password)
    };
    setPasswordRequirements(requirements);
    const allMet = Object.values(requirements).every(Boolean);
    if (!allMet) {
      setError('Password does not meet all requirements.');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    setError('');
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'password') {
      const pwd = e.target.value;
      setPasswordRequirements({
        length: pwd.length >= 8,
        uppercase: /[A-Z]/.test(pwd),
        lowercase: /[a-z]/.test(pwd),
        digit: /[0-9]/.test(pwd),
        special: /[^A-Za-z0-9]/.test(pwd)
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (!apiBaseUrl) {
        setError('Backend URL not loaded.');
        setLoading(false);
        return;
      }
      const res = await axios.post(`${apiBaseUrl}/api/auth/register`, form);
      // Backend returns AuthResultDto (Token + User) on success; any 2xx here is a successful registration
      if (res.status >= 200 && res.status < 300 && res.data && res.data.token) {
        setSuccess('Registration successful! You can now log in.');
        setError('');
      } else {
        setError('Registration failed.');
        setSuccess('');
      }
    } catch (err: any) {
      const backendDetail = err.response?.data?.detail || err.response?.data?.error || err.response?.data?.title;
      const message = backendDetail || 'Registration failed.';
      setError(message);
      setSuccess('');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Sign Up</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              name="firstName"
              id="firstName"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              name="lastName"
              id="lastName"
              placeholder="Last Name"
              value={form.lastName}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <ul className="text-xs mt-2 ml-2 text-gray-600">
              <li className={passwordRequirements.length ? 'text-green-600' : 'text-red-600'}>At least 8 characters</li>
              <li className={passwordRequirements.uppercase ? 'text-green-600' : 'text-red-600'}>At least one uppercase letter</li>
              <li className={passwordRequirements.lowercase ? 'text-green-600' : 'text-red-600'}>At least one lowercase letter</li>
              <li className={passwordRequirements.digit ? 'text-green-600' : 'text-red-600'}>At least one digit</li>
              <li className={passwordRequirements.special ? 'text-green-600' : 'text-red-600'}>At least one special character</li>
            </ul>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="preferredCurrency" className="block text-sm font-medium text-gray-700">Preferred Currency</label>
            <input
              type="text"
              name="preferredCurrency"
              id="preferredCurrency"
              placeholder="Preferred Currency (e.g. USD)"
              value={form.preferredCurrency}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Sign Up'}
          </button>
        </form>
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mt-4 text-center">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-2 rounded mt-4 text-center">{success}</div>}
        <div className="flex justify-end mt-4 text-sm">
          <a href="/login" className="text-blue-600 hover:underline">Already have an account? Login</a>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
