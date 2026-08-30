import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Booking Form State
  const [seatsBooked, setSeatsBooked] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    fetchEventDetails();
    
    // Dynamically load Razorpay Checkout SDK
    if (!document.getElementById('razorpay-sdk')) {
      const script = document.createElement('script');
      script.id = 'razorpay-sdk';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [id]);

  const fetchEventDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`events/${id}/`);
      setEvent(response.data);
    } catch (err) {
      console.error('Fetch event detail error:', err);
      if (err.response?.status === 401) {
        navigate('/login', { state: { from: location } });
      } else if (err.response?.status === 404) {
        setError('Event not found.');
      } else {
        setError('Failed to load event details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (seatsBooked < 1) {
      setBookingError('Please book at least 1 seat.');
      return;
    }

    if (!window.Razorpay) {
      setBookingError('Payment gateway SDK is still loading. Please try again in a few seconds.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');
    setBookingSuccess(false);

    try {
      // Step 1: Create the Booking
      const bookingResponse = await api.post('bookings/', {
        event: parseInt(id, 10),
        seats_booked: parseInt(seatsBooked, 10),
      });

      const bookingId = bookingResponse.data.id;

      // Step 2: Create Payment Order on backend
      const paymentResponse = await api.post('create-payment/', {
        booking_id: bookingId,
      });

      const { order_id, amount, currency, key_id } = paymentResponse.data;

      // Step 3: Open Razorpay Checkout widget
      const options = {
        key: key_id,
        amount: amount,
        currency: currency,
        order_id: order_id,
        name: 'EventHub',
        description: `Booking for ${event.title}`,
        handler: async function (response) {
          try {
            setBookingLoading(true);
            setBookingError('');
            
            // Step 4: Verify payment on backend
            await api.post('verify-payment/', {
              booking_id: bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setBookingSuccess(true);
            // Fetch updated event details to show updated remaining seats
            await fetchEventDetails();
            
            // Delay redirection to let user see success message
            setTimeout(() => {
              navigate('/my-bookings');
            }, 1500);
          } catch (verifyErr) {
            console.error('Payment verification failed:', verifyErr);
            const verifyErrData = verifyErr.response?.data;
            let verifyMsg = 'Payment verification failed. Please try again.';
            if (verifyErrData) {
              if (typeof verifyErrData === 'string') {
                verifyMsg = verifyErrData;
              } else {
                verifyMsg = verifyErrData.error || verifyErrData.detail || verifyMsg;
              }
            }
            setBookingError(verifyMsg);
          } finally {
            setBookingLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setBookingLoading(false);
            setBookingError('Payment checkout was closed. You can retry from your bookings or book again.');
          }
        },
        prefill: {
          name: user?.username || '',
          email: '',
        },
        theme: {
          color: '#4f46e5', // our accent Indigo color
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error('Booking/Payment creation error:', err);
      
      // Capture standard backend validation errors (e.g. "Only X seats remaining")
      const errData = err.response?.data;
      if (errData) {
        if (typeof errData === 'string') {
          setBookingError(errData);
        } else if (errData.detail) {
          setBookingError(errData.detail);
        } else if (errData.non_field_errors) {
          setBookingError(Array.isArray(errData.non_field_errors) ? errData.non_field_errors[0] : errData.non_field_errors);
        } else if (errData.seats_booked) {
          setBookingError(Array.isArray(errData.seats_booked) ? errData.seats_booked[0] : errData.seats_booked);
        } else {
          // Flatten any object values
          const errorMsg = Object.values(errData).flat().join(' ');
          setBookingError(errorMsg || 'Booking creation failed. Please try again.');
        }
      } else {
        setBookingError('Unable to process booking. Please check connection.');
      }
      setBookingLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70svh] bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-medium">Loading event details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-slate-50 min-h-[70svh] flex flex-col justify-center">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-lg mx-auto shadow-sm">
          <svg className="w-12 h-12 text-slate-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h3>
          <p className="text-slate-600 mb-6">{error || 'Event could not be found.'}</p>
          <Link to="/" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm">
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const availableSeats = event.seats_remaining !== undefined ? event.seats_remaining : event.total_seats;
  const isSoldOut = availableSeats <= 0;

  return (
    <div className="bg-slate-50 min-h-[85svh] py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Events
          </Link>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
              
              {/* Header Title */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {event.title}
                </h1>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                    {formatPrice(event.price)}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${isSoldOut ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {isSoldOut ? 'Sold Out' : `${availableSeats} Seats Available`}
                  </span>
                </div>
              </div>

              {/* Event Meta Information */}
              <div className="border-t border-b border-slate-100 py-6 space-y-4 text-slate-700">
                <div className="flex items-start">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500 mr-4 shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Date and Time</h3>
                    <p className="text-sm mt-0.5">{formatDate(event.date_time)}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500 mr-4 shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Location</h3>
                    <p className="text-sm mt-0.5">{event.location}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500 mr-4 shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Host / Organizer ID</h3>
                    <p className="text-sm mt-0.5">User #{event.organizer || 'System'}</p>
                  </div>
                </div>
              </div>

              {/* Event Description */}
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">About This Event</h2>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                  {event.description || 'No description available for this event.'}
                </p>
              </div>

            </div>
          </div>

          {/* Booking Widget Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-24 space-y-6">
              <h2 className="text-lg font-bold text-slate-900">Ticket Booking</h2>
              
              {bookingSuccess && (
                <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Booking successful! Redirecting...</span>
                </div>
              )}

              {bookingError && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-start" role="alert">
                  <svg className="w-5 h-5 mr-2 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{bookingError}</span>
                </div>
              )}

              {!user ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    You must be signed in to purchase tickets and reserve seats for this event.
                  </p>
                  <Link
                    to="/login"
                    state={{ from: location }}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors text-center cursor-pointer"
                  >
                    Log In to Book
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleBooking} className="space-y-4">
                  <div>
                    <label htmlFor="seats-input" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Number of Seats
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => setSeatsBooked(Math.max(1, seatsBooked - 1))}
                        disabled={seatsBooked <= 1 || isSoldOut || bookingLoading}
                        className="w-10 h-10 border border-slate-300 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      
                      <input
                        id="seats-input"
                        type="number"
                        min="1"
                        max={availableSeats > 0 ? availableSeats : 100}
                        value={seatsBooked}
                        onChange={(e) => setSeatsBooked(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        disabled={isSoldOut || bookingLoading}
                        className="block w-20 h-10 border border-slate-300 rounded-lg text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />

                      <button
                        type="button"
                        onClick={() => setSeatsBooked(seatsBooked + 1)}
                        disabled={isSoldOut || (availableSeats !== undefined && seatsBooked >= availableSeats) || bookingLoading}
                        className="w-10 h-10 border border-slate-300 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-sm font-semibold">
                    <span className="text-slate-600">Total Price</span>
                    <span className="text-slate-900 text-lg">
                      {event.price && event.price > 0 
                        ? `\$${(event.price * seatsBooked).toFixed(2)}` 
                        : 'Free'}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSoldOut || bookingLoading || bookingSuccess}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer h-11 items-center"
                  >
                    {bookingLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : isSoldOut ? (
                      'Sold Out'
                    ) : (
                      'Reserve Seats'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
