import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';

export default function Signup() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validation States
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateUsername = (val) => {
    if (!val.trim()) {
      setUsernameError('Username is required');
      return false;
    }
    if (val.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const validateEmail = (val) => {
    if (!val.trim()) {
      setEmailError('Email is required');
      return false;
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(val)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (val) => {
    if (!val) {
      setPasswordError('Password is required');
      return false;
    }
    if (val.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleBlur = (field) => {
    if (field === 'username') validateUsername(username);
    if (field === 'email') validateEmail(email);
    if (field === 'password') validatePassword(password);
  };

  const handleChange = (field, val) => {
    if (field === 'username') {
      setUsername(val);
      if (usernameError) validateUsername(val);
    }
    if (field === 'email') {
      setEmail(val);
      if (emailError) validateEmail(val);
    }
    if (field === 'password') {
      setPassword(val);
      if (passwordError) validatePassword(val);
    }
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isUserValid = validateUsername(username);
    const isEmailValid = validateEmail(email);
    const isPassValid = validatePassword(password);

    if (!isUserValid || !isEmailValid || !isPassValid) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('register/', {
        username,
        email,
        password,
      });

      // Redirect to OTP verification page, passing the username in state
      navigate('/verify-otp', { state: { username } });
    } catch (err) {
      console.error('Registration error:', err);
      const errData = err.response?.data;
      if (errData) {
        if (typeof errData === 'string') {
          setError(errData);
        } else if (errData.detail) {
          setError(errData.detail);
        } else {
          // Map dictionary errors (like email already exists or username already exists)
          const errorMsg = Object.entries(errData)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(' ') : msgs}`)
            .join(' | ');
          setError(errorMsg || 'Registration failed. Please try again.');
        }
      } else {
        setError('Unable to connect to the server. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80svh] flex-col justify-center py-12 px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900">
          Create an EventHub account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10">
          {error && (
            <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg" role="alert">
              <div className="flex">
                <svg className="w-5 h-5 mr-2 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-slate-700 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => handleChange('username', e.target.value)}
                onBlur={() => handleBlur('username')}
                className={`block w-full h-11 px-3 py-2 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-all ${
                  usernameError ? 'border-red-300 bg-red-50/30' : 'border-slate-300'
                }`}
                placeholder="choose a username"
              />
              {usernameError && (
                <p className="mt-1 text-xs text-red-600 font-medium">{usernameError}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={`block w-full h-11 px-3 py-2 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-all ${
                  emailError ? 'border-red-300 bg-red-50/30' : 'border-slate-300'
                }`}
                placeholder="you@example.com"
              />
              {emailError && (
                <p className="mt-1 text-xs text-red-600 font-medium">{emailError}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                className={`block w-full h-11 px-3 py-2 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-all ${
                  passwordError ? 'border-red-300 bg-red-50/30' : 'border-slate-300'
                }`}
                placeholder="at least 6 characters"
              />
              {passwordError && (
                <p className="mt-1 text-xs text-red-600 font-medium">{passwordError}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer h-11 items-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Sign Up'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
