import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function CreateEvent() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [totalSeats, setTotalSeats] = useState('');
  const [price, setPrice] = useState('');

  // Status & Validation
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const tempErrors = {};
    if (!title.trim()) tempErrors.title = 'Title is required';
    if (!location.trim()) tempErrors.location = 'Location is required';
    if (!dateTime) {
      tempErrors.dateTime = 'Date and time are required';
    } else {
      const selectedDate = new Date(dateTime);
      const now = new Date();
      if (selectedDate <= now) {
        tempErrors.dateTime = 'Event must be scheduled in the future';
      }
    }

    const seatsNum = parseInt(totalSeats, 10);
    if (!totalSeats) {
      tempErrors.totalSeats = 'Total seats are required';
    } else if (isNaN(seatsNum) || seatsNum <= 0) {
      tempErrors.totalSeats = 'Total seats must be a positive integer';
    }

    const priceNum = parseFloat(price);
    if (price === '') {
      tempErrors.price = 'Price is required (enter 0 for free)';
    } else if (isNaN(priceNum) || priceNum < 0) {
      tempErrors.price = 'Price cannot be negative';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');

    // Prepare ISO 8601 date string
    let formattedDate = dateTime;
    try {
      formattedDate = new Date(dateTime).toISOString();
    } catch (e) {
      console.error('Date parsing failed:', e);
    }

    try {
      const payload = {
        title,
        description,
        location,
        date_time: formattedDate,
        total_seats: parseInt(totalSeats, 10),
        price: parseFloat(price),
      };

      const response = await api.post('events/', payload);
      // Redirect to the newly created event details page
      const newEventId = response.data.id;
      navigate(`/events/${newEventId}`);
    } catch (err) {
      console.error('Create event error:', err);
      const errData = err.response?.data;
      if (errData) {
        if (typeof errData === 'string') {
          setError(errData);
        } else if (errData.detail) {
          setError(errData.detail);
        } else {
          // Display structured backend validation errors
          setErrors(errData);
          setError('Failed to create event. Please correct the fields below.');
        }
      } else {
        setError('Connection error. Failed to create event.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-[85svh] py-10">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-sm">
          
          {/* Header */}
          <div className="mb-8 border-b border-slate-100 pb-5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Create New Event
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Set up a new booking page for your event. Fill out the details below.
            </p>
          </div>

          {/* Banner Error */}
          {error && (
            <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-start" role="alert">
              <svg className="w-5 h-5 mr-2 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-1">
                Event Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors({ ...errors, title: '' });
                }}
                className={`block w-full h-11 px-3 py-2 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                  errors.title ? 'border-red-300 bg-red-50/20' : 'border-slate-300'
                }`}
                placeholder="e.g. NextGen Web Conference"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="Provide a description of the event format, schedule, speakers..."
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-semibold text-slate-700 mb-1">
                Location
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (errors.location) setErrors({ ...errors, location: '' });
                }}
                className={`block w-full h-11 px-3 py-2 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                  errors.location ? 'border-red-300 bg-red-50/20' : 'border-slate-300'
                }`}
                placeholder="e.g. San Francisco, CA or Online (Zoom Link)"
              />
              {errors.location && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.location}</p>
              )}
            </div>

            {/* Grid for Date & Time, Seats, Price */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Date Time */}
              <div>
                <label htmlFor="date-time" className="block text-sm font-semibold text-slate-700 mb-1">
                  Date & Time
                </label>
                <input
                  id="date-time"
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => {
                    setDateTime(e.target.value);
                    if (errors.dateTime || errors.date_time) {
                      setErrors({ ...errors, dateTime: '', date_time: '' });
                    }
                  }}
                  className={`block w-full h-11 px-3 py-2 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                    errors.dateTime || errors.date_time ? 'border-red-300 bg-red-50/20' : 'border-slate-300'
                  }`}
                />
                {(errors.dateTime || errors.date_time) && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {errors.dateTime || (Array.isArray(errors.date_time) ? errors.date_time[0] : errors.date_time)}
                  </p>
                )}
              </div>

              {/* Total Seats */}
              <div>
                <label htmlFor="total-seats" className="block text-sm font-semibold text-slate-700 mb-1">
                  Total Seats
                </label>
                <input
                  id="total-seats"
                  type="number"
                  min="1"
                  value={totalSeats}
                  onChange={(e) => {
                    setTotalSeats(e.target.value);
                    if (errors.totalSeats || errors.total_seats) {
                      setErrors({ ...errors, totalSeats: '', total_seats: '' });
                    }
                  }}
                  className={`block w-full h-11 px-3 py-2 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                    errors.totalSeats || errors.total_seats ? 'border-red-300 bg-red-50/20' : 'border-slate-300'
                  }`}
                  placeholder="e.g. 100"
                />
                {(errors.totalSeats || errors.total_seats) && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {errors.totalSeats || (Array.isArray(errors.total_seats) ? errors.total_seats[0] : errors.total_seats)}
                  </p>
                )}
              </div>

              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-semibold text-slate-700 mb-1">
                  Price ($)
                </label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    if (errors.price) setErrors({ ...errors, price: '' });
                  }}
                  className={`block w-full h-11 px-3 py-2 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                    errors.price ? 'border-red-300 bg-red-50/20' : 'border-slate-300'
                  }`}
                  placeholder="0 for free"
                />
                {errors.price && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {Array.isArray(errors.price) ? errors.price[0] : errors.price}
                  </p>
                )}
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 border-t border-slate-100 pt-6 mt-8">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer min-w-[120px] items-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Create Event'
                )}
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
