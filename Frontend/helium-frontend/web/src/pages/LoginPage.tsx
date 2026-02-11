import React, { useState } from 'react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });

  const [showSignup, setShowSignup] = useState(false);
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const emailError =
    touched.email && !email
      ? 'Email is required'
      : touched.email && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? 'Enter a valid email address'
      : '';

  const passwordError =
    touched.password && !password
      ? 'Password is required'
      : touched.password && password.length > 0 && password.length < 6
      ? 'Password must be at least 6 characters'
      : '';

  const hasErrors = Boolean(emailError || passwordError);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (hasErrors || !email || !password) {
      return;
    }
    // TODO: integrate with backend auth API
  };

  const handleOpenSignup = () => {
    setShowSignup(true);
  };

  const handleCloseSignup = () => {
    setShowSignup(false);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic front-end validation; integrate real logic later
    if (!signupEmail || !signupPassword || !signupConfirmPassword) {
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      return;
    }
    // TODO: call signup API then optionally auto-fill login form
    setShowSignup(false);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark bg-gradient px-3 px-md-0">
      <div className="container" aria-label="Login page">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4">
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  <h1 className="h4 fw-semibold text-dark mb-1">Sign in to Helium</h1>
                  <p className="text-muted small mb-0">
                    Enter your credentials to access your account.
                  </p>
                </div>

                <form className="needs-validation" onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label small fw-medium">
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                      aria-invalid={emailError ? 'true' : 'false'}
                      aria-describedby={emailError ? 'email-error' : undefined}
                      className={`form-control form-control-sm rounded-3 ${
                        emailError ? 'is-invalid' : touched.email && !emailError ? 'is-valid' : ''
                      }`}
                      placeholder="you@example.com"
                    />
                    {emailError && (
                      <div id="email-error" className="invalid-feedback d-block small">
                        {emailError}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label htmlFor="password" className="form-label small fw-medium mb-0">
                        Password
                      </label>
                      <a
                        href="#"
                        className="small text-decoration-none text-primary"
                      >
                        Forgot password?
                      </a>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                      aria-invalid={passwordError ? 'true' : 'false'}
                      aria-describedby={passwordError ? 'password-error' : undefined}
                      className={`form-control form-control-sm rounded-3 ${
                        passwordError
                          ? 'is-invalid'
                          : touched.password && !passwordError
                          ? 'is-valid'
                          : ''
                      }`}
                      placeholder="••••••••"
                    />
                    {passwordError && (
                      <div id="password-error" className="invalid-feedback d-block small">
                        {passwordError}
                      </div>
                    )}
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="form-check-input"
                      />
                      <label htmlFor="remember-me" className="form-check-label small">
                        Remember me
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 rounded-3 py-2 fw-semibold btn-sm"
                    disabled={!email || !password}
                  >
                    Log in
                  </button>
                  <p className="text-center text-muted small mt-3 mb-0">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      className="btn btn-link p-0 align-baseline small"
                      onClick={handleOpenSignup}
                    >
                      Sign up
                    </button>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSignup && (
        <div
          className="modal fade show d-block"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signupModalLabel"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title" id="signupModalLabel">
                  Create your account
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={handleCloseSignup}
                />
              </div>
              <div className="modal-body pt-3">
                <form onSubmit={handleSignupSubmit}>
                  <div className="mb-3">
                    <label htmlFor="signup-name" className="form-label small fw-medium">
                      Full name
                    </label>
                    <input
                      id="signup-name"
                      type="text"
                      className="form-control form-control-sm rounded-3"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="signup-email" className="form-label small fw-medium">
                      Email address
                    </label>
                    <input
                      id="signup-email"
                      type="email"
                      className="form-control form-control-sm rounded-3"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="signup-password" className="form-label small fw-medium">
                      Password
                    </label>
                    <input
                      id="signup-password"
                      type="password"
                      className="form-control form-control-sm rounded-3"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="signup-confirm-password" className="form-label small fw-medium">
                      Confirm password
                    </label>
                    <input
                      id="signup-confirm-password"
                      type="password"
                      className="form-control form-control-sm rounded-3"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm rounded-3"
                      onClick={handleCloseSignup}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm rounded-3"
                    >
                      Sign up
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={handleCloseSignup} />
        </div>
      )}
    </div>
  );
};

export default LoginPage;
