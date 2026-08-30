import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? 'text-indigo-600 bg-indigo-50/50'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Event<span className="text-indigo-600">Hub</span>
              </span>
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:flex space-x-1">
              <NavLink to="/" className={linkClass}>
                Events
              </NavLink>
              {user && (
                <>
                  <NavLink to="/create-event" className={linkClass}>
                    Create Event
                  </NavLink>
                  <NavLink to="/my-bookings" className={linkClass}>
                    My Bookings
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          {/* User controls / Auth */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-600 font-medium">
                  Hi, <span className="text-slate-900">{user.username}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all cursor-pointer shadow-sm hover:shadow"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
