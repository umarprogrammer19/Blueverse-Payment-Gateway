"use client";

import { CheckCircleIcon } from "@heroicons/react/24/outline";

export default function PaymentSuccess() {
    return (
        <div className="min-h-screen bg-linear-to-br from-green-50 to-blue-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                {/* Success Icon */}
                <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircleIcon className="w-16 h-16 text-green-600" />
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>

                {/* Message */}
                <p className="text-gray-600 mb-8">
                    Thank you for your purchase. Your transaction has been processed successfully.
                </p>

                {/* Back Button */}
                <button
                    onClick={() => window.location.href = "https://wheat-ferret-827560.hostingersite.com/"}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    Go Back
                </button>
            </div>
        </div>
    );
}