import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/api';

export default function EventsList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [searchTitle, setSearchTitle] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('events/');
      setEvents(response.data);
    } catch (err) {
      console.error('Fetch events error:', err);
      if (err.response?.status === 401) {
        navigate('/login', { state: { from: location } });
      } else {
        setError('Failed to load events. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesTitle = event.title
      ?.toLowerCase()
      .includes(searchTitle.toLowerCase());
    const matchesLocation = event.location
      ?.toLowerCase()
      .includes(searchLocation.toLowerCase());
    return matchesTitle && matchesLocation;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatPrice = (price) => {
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice === 0) return 'Free';
    return `\$${numPrice.toFixed(2)}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-slate-50 min-h-[85svh]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Explore Events
          </h1>
          <p className="mt-2 text-slate-600">
            Discover and book standard, virtual, or physical events happening around you.
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 items-end">
          <div>
            <label htmlFor="search-title" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Search by Title
            </label>
            <div className="relative">
              <input
                id="search-title"
                type="text"
                placeholder="Find a specific event..."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                className="block w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="search-location" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Filter by Location
            </label>
            <div className="relative">
              <input
                id="search-location"
                type="text"
                placeholder="e.g. San Francisco"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="block w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            {(searchTitle || searchLocation) && (
              <button
                onClick={() => {
                  setSearchTitle('');
                  setSearchLocation('');
                }}
                className="px-4 h-10 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={fetchEvents}
              className="px-4 h-10 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer flex-1"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-medium">Fetching events...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto">
          <svg
            className="w-12 h-12 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Failed to load events</h3>
          <p className="text-sm text-slate-600 mb-4">{error}</p>
          <button
            onClick={fetchEvents}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Events Grid */}
      {!loading && !error && (
        <>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
              <svg
                className="mx-auto h-12 w-12 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">No events found</h3>
              <p className="mt-1 text-sm text-slate-500">
                {events.length === 0
                  ? 'There are currently no events scheduled.'
                  : 'Try adjusting your search criteria.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => {
                const availableSeats = event.seats_remaining !== undefined ? event.seats_remaining : event.total_seats;
                const isSoldOut = availableSeats <= 0;

                return (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden group"
                  >
                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Time & Price */}
                        <div className="flex items-center justify-between text-xs font-semibold mb-2">
                          <span className="text-indigo-600 tracking-wider uppercase">
                            {formatDate(event.date_time)}
                          </span>
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full font-medium">
                            {formatPrice(event.price)}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2 line-clamp-1">
                          {event.title}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                          {event.description || 'No description provided.'}
                        </p>
                      </div>

                      {/* Location & Seats */}
                      <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-600 mt-auto">
                        <span className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-1 text-slate-400 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span className="line-clamp-1">{event.location}</span>
                        </span>

                        <span className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-1 text-slate-400 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <span className={`font-semibold ${isSoldOut ? 'text-red-600' : 'text-slate-700'}`}>
                            {isSoldOut ? 'Sold Out' : `${availableSeats} left`}
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
