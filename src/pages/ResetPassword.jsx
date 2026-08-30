import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  // Read username from state, if not present allow user to type it
  const passedUsername = location.state?.username || '';
  
  const [username, setUsername] = useState(passedUsername);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Resend Timer State
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = async () => {
    if (!username.trim()) {
      setError('Username is required to resend reset code.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await api.post('resend-otp/', {
        username,
        purpose: 'reset_password',
      });
      setSuccessMessage(response.data?.message || 'A fresh reset code has been sent to your email.');
      setTimer(30); // 30 seconds cooldown
    } catch (err) {
      console.error('Resend reset code error:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to resend OTP. Please try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username is required.');
      return;
    }
    if (!code.trim() || code.length !== 6 || isNaN(Number(code))) {
      setError('Please enter a valid 6-digit numeric reset code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await api.post('reset-password/', {
        username,
        code,
        new_password: newPassword,
      });

      // Redirect to login page on success
      navigate('/login', {
        state: { message: 'Your password has been successfully reset! You can now log in with your new password.' },
        replace: true,
      });
    } catch (err) {
      console.error('Reset password error:', err);
      const errData = err.response?.data;
      if (errData) {
        if (typeof errData === 'string') {
          setError(errData);
        } else if (errData.error) {
          setError(errData.error);
        } else if (errData.detail) {
          setError(errData.detail);
        } else {
          setError('Invalid or expired reset code.');
        }
      } else {
        setError('Connection failed. Please check your network and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80svh] flex-col justify-center py-12 px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900">
          Reset Password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Enter the reset code sent to your email and choose a new password.
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

          {successMessage && (
            <div className="mb-6 p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg" role="alert">
              <div className="flex">
                <svg className="w-5 h-5 mr-2 shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{successMessage}</span>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Username field (editable only if not passed from Forgot Password page) */}
            {!passedUsername && (
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-slate-700 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full h-11 px-3 py-2 border border-slate-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-all"
                  placeholder="Enter your username"
                />
              </div>
            )}

            <div>
              <label htmlFor="code" className="block text-sm font-semibold text-slate-700 mb-1">
                6-Digit Reset Code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength="6"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="block w-full h-11 px-3 py-2 border border-slate-300 rounded-lg shadow-sm text-sm tracking-[0.75em] text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-all"
                placeholder="000000"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-semibold text-slate-700 mb-1">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full h-11 px-3 py-2 border border-slate-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-all"
                placeholder="at least 6 characters"
              />
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
                  'Reset Password'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <button
              onClick={handleResend}
              disabled={timer > 0 || loading}
              className="text-indigo-600 hover:text-indigo-500 font-medium disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
            >
              {timer > 0 ? `Resend code in ${timer}s` : 'Resend code'}
            </button>
            <Link to="/login" className="text-slate-600 hover:text-slate-900">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
