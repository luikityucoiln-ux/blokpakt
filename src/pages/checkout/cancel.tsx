/**
 * Checkout Cancel Page
 *
 * Displayed when a user leaves the demo booking flow.
 *
 * URL: /checkout/cancel
 */
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';

export default function CheckoutCancel() {
  return (
    <>
      <Helmet>
        <title>Booking Cancelled — Blokpakt</title>
        <meta name="description" content="Your Blokpakt demo booking was cancelled." />
        <link rel="canonical" href="https://blokpakt.com/checkout/cancel" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* Cancel Icon */}
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking cancelled</h1>

        <p className="text-gray-600 mb-6">
          Your demo booking was not saved.
        </p>

        <div className="space-y-3">
          <Link
            to="/"
            className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Continue booking
          </Link>

          <Link
            to="/"
            className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Go home
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Need help?{' '}
          <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
            Contact support
          </a>
        </p>
      </div>
      </div>
    </>
  );
}

