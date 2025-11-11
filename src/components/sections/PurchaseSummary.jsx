"use client";
import { Check } from "lucide-react";

export default function PurchaseSummary({
    packages = [],
    couponCode,
    onCouponChange,
    onApplyCoupon,
    onCheckout,
}) {
    return (
        <div className="space-y-6">
            {/* Discount Code */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount or coupon code
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        name="couponCode"
                        placeholder="Enter code"
                        value={couponCode}
                        onChange={onCouponChange}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <button onClick={onApplyCoupon} className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors">
                        Apply
                    </button>
                </div>
            </div>

            {/* Package Prices (drilled via props) */}
            {packages.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-semibold">Packages</h4>
                    {packages.map((p) => (
                        <div key={p.washbookId} className="flex justify-between text-sm">
                            <span className="text-gray-700">{p.washbookName}</span>
                            <span className="text-gray-900">${Number(p.washbookPrice || 0).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Order Summary (static unless you want total of selected items) */}
            <div className="space-y-3 py-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">$0.00</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discounts</span>
                    <span className="text-gray-900">$0.00</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">$0.00</span>
                </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center py-4 border-t border-gray-200 border-b">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">$0.00</span>
            </div>

            {/* Checkout Button */}
            <button
                onClick={onCheckout}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
                CHECKOUT
            </button>

            {/* Terms and Payment */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="terms" className="w-4 h-4 border border-gray-300 rounded cursor-pointer" />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                        I agree to the{" "}
                        <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
                    </label>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                    <img src="/visa.png" alt="Visa" className="h-8" />
                    <img src="/money.png" alt="Mastercard" className="h-8" />
                    <img src="/amex.png" alt="American Express" className="h-8" />
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Check size={16} className="text-green-600" />
                    <span>Payments are secure and encrypted</span>
                </div>
            </div>
        </div>
    );
}
