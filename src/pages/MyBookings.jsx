import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

export default function MyBookings() {
  const { user } = useAuth();
  
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Action state (for cancellation load indicators)
  const [cancellingId, setCancellingId] = useState(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch both bookings and events concurrently to perform client-side join
      const [bookingsRes, eventsRes] = await Promise.all([
        api.get('bookings/'),
        api.get('events/'),
      ]);
      
      setBookings(bookingsRes.data);
      setEvents(eventsRes.data);
    } catch (err) {
      console.error('Fetch bookings data error:', err);
      setError('Failed to load your bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setCancellingId(bookingId);
    setActionError('');

    try {
      await api.patch(`bookings/${bookingId}/`, {
        status: 'cancelled',
      });
      
      // Update local state to show cancelled status immediately
      setBookings(
        bookings.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
      );
    } catch (err) {
      console.error('Cancel booking error:', err);
      
      // Fallback to DELETE if PATCH fails
      const useDelete = window.confirm(
        'The backend validation failed to process the cancellation request. Would you like to permanently delete this booking instead?'
      );
      
      if (useDelete) {
        try {
          await api.delete(`bookings/${bookingId}/`);
          setBookings(bookings.filter((b) => b.id !== bookingId));
        } catch (deleteErr) {
          console.error('Delete booking error:', deleteErr);
          setActionError('Failed to delete booking. Please try again.');
        }
      } else {
        if (err.response?.status === 403) {
          setActionError('Permission denied. You can only cancel your own bookings.');
        } else {
          setActionError('Failed to cancel booking. Please try again.');
        }
      }
    } finally {
      setCancellingId(null);
    }
  };

  // 1. Filter bookings for the logged-in user
  // Handles attendee as an object, string, or number and casts both sides to Numbers for type safety
  const myBookings = bookings.filter((b) => {
    const attendeeId = typeof b.attendee === 'object' && b.attendee !== null ? b.attendee.id : b.attendee;
    return Number(attendeeId) === Number(user?.user_id);
  });

  // Helper to map booking.event to event details (handles both ID and nested object cases)
  const getEventDetails = (bookingEvent) => {
    if (typeof bookingEvent === 'object' && bookingEvent !== null) {
      return bookingEvent;
    }
    // If bookingEvent is an ID (number or string), find the event from events list
    const eventId = parseInt(bookingEvent, 10);
    return events.find((e) => e.id === eventId) || null;
  };

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
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          My Bookings
        </h1>
        <p className="mt-2 text-slate-600">
          View, manage, and track reservations you've made for upcoming events.
        </p>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center" role="alert">
          <svg className="w-5 h-5 mr-2 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{actionError}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-medium">Loading bookings list...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto shadow-sm">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Failed to load bookings</h3>
          <p className="text-sm text-slate-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Bookings List */}
      {!loading && !error && (
        <>
          {myBookings.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">No bookings yet</h3>
              <p className="mt-1 text-sm text-slate-500">You haven't reserved seats for any events.</p>
              <div className="mt-6">
                <Link to="/" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm">
                  Browse Events
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {myBookings.map((booking) => {
                const eventDetails = getEventDetails(booking.event);
                const isCancelled = booking.status === 'cancelled';

                return (
                  <div
                    key={booking.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-colors"
                  >
                    {/* Event & Booking Meta */}
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            isCancelled
                              ? 'bg-red-50 text-red-700 border border-red-100'
                              : 'bg-green-50 text-green-700 border border-green-100'
                          }`}
                        >
                          {booking.status || 'confirmed'}
                        </span>
                        
                        <span className="text-xs text-slate-500 font-medium">
                          Booking #{booking.id}
                        </span>
                      </div>

                      {eventDetails ? (
                        <div>
                          <Link
                            to={`/events/${eventDetails.id}`}
                            className="text-lg font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                          >
                            {eventDetails.title}
                          </Link>
                          
                          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-600 font-medium">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(eventDetails.date_time)}
                            </span>

                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {eventDetails.location}
                            </span>

                            <span className="flex items-center">
                              <span className="text-slate-400 mr-1 font-bold">$</span>
                              {formatPrice(eventDetails.price)} each
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Event Details Loading... (ID: {booking.event})
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Booking Stats / Actions */}
                    <div className="flex flex-row sm:items-center justify-between md:flex-col md:items-end gap-4 shrink-0 pt-4 md:pt-0 border-t border-slate-100 md:border-0">
                      
                      {/* Seats & Price Summary */}
                      <div className="text-left md:text-right">
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Seats Reserved</p>
                        <p className="text-lg font-bold text-slate-900">{booking.seats_booked} seats</p>
                        {eventDetails && (
                          <p className="text-xs text-slate-600 mt-0.5">
                            Total: {eventDetails.price > 0 ? `\$${(eventDetails.price * booking.seats_booked).toFixed(2)}` : 'Free'}
                          </p>
                        )}
                      </div>

                      {/* Cancel Action */}
                      {!isCancelled && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="px-4 py-2 border border-red-200 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                        >
                          {cancellingId === booking.id ? (
                            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            'Cancel Booking'
                          )}
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
