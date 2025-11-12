"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import moment from "moment-timezone";
import CryptoJS from "crypto-js";

/**
 * NOTE (security):
 * Replicates your HTML page exactly, including client-side signature generation.
 * In production, you should compute the signature on your server and never ship the shared secret to the client.
 */

export default function PurchaseSummary({
    // your original props
    selectedPackage,
    subtotal = 0,
    discounts = 0,
    tax = 0,
    total = 0,
    couponCode,
    onCouponChange,
    onApplyCoupon,
    onCheckout,

    environment = "https://test.ipg-online.com/connect/gateway/processing",
    sharedSecret = "2zuW4j)G3.",
    storeName = "811676300198",
    language = "en_US",
    defaultTxnType = "sale",
    defaultCurrency = "784",
    defaultPaymentMethod = "",
    defaultCheckoutOption = "combinedpage",
    responseFailURL = "https://fiservsimulator.somee.com/IPGDemo/FailureResponse",
    responseSuccessURL = "https://fiservsimulator.somee.com/IPGDemo/SuccessResponse",
    transactionNotificationURL = "",
}) {
    // UI state mirroring your HTML form
    const [timezone, setTimezone] = useState("Asia/Dubai");
    const [txntype, setTxntype] = useState(defaultTxnType);
    const [currency, setCurrency] = useState(defaultCurrency);
    const [paymentMethod, setPaymentMethod] = useState(defaultPaymentMethod);
    const [checkoutoption, setCheckoutoption] = useState(defaultCheckoutOption);
    const [oid, setOid] = useState("");

    const txndatetime = useMemo(() => {
        return moment().tz(timezone).format("YYYY:MM:DD-HH:mm:ss");
    }, [timezone]);

    const chargeTotal = useMemo(() => {
        const val = Number(total ?? selectedPackage?.washbookPrice ?? 0);
        return val.toFixed(2);
    }, [total, selectedPackage]);

    function createSignature(paymentParams, secret) {
        const ignore = new Set(["hashExtended"]);
        const sortedKeys = Object.keys(paymentParams)
            .filter((k) => paymentParams[k] !== "" && !ignore.has(k))
            .sort();

        const messageSignatureContent = sortedKeys.map((k) => String(paymentParams[k]));
        const raw = messageSignatureContent.join("|");
        const hmac = CryptoJS.HmacSHA256(raw, secret);
        return CryptoJS.enc.Base64.stringify(hmac);
    }

    function buildPaymentParams() {
        return {
            hash_algorithm: "HMACSHA256",
            language,
            hashExtended: "",
            txntype,
            timezone,
            txndatetime,
            storename: storeName,
            chargetotal: chargeTotal,
            currency,
            paymentMethod,
            oid,
            checkoutoption,
            responseFailURL,
            responseSuccessURL,
            transactionNotificationURL,
        };
    }

    function submitToIPG() {
        const params = buildPaymentParams();
        const hashExtended = createSignature(params, sharedSecret);
        const form = document.createElement("form");
        form.method = "POST";
        form.action = environment;
        const allParams = { ...params, hashExtended };
        Object.entries(allParams).forEach(([name, value]) => {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = name;
            input.value = value ?? "";
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
    }

    const handleCheckout = () => {
        if (typeof onCheckout === "function") {
            try {
                onCheckout();
            } catch {
            }
        }
        submitToIPG();
    };

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
                    <button
                        onClick={onApplyCoupon}
                        type="button"
                        className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                    >
                        Apply
                    </button>
                </div>
            </div>

            {/* Selected Package */}
            <div className="space-y-2">
                <h4 className="font-semibold">Selected package</h4>
                {selectedPackage ? (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-700">
                            {selectedPackage.washbookName}
                        </span>
                        <span className="text-gray-900">
                            ${Number(selectedPackage.washbookPrice || 0).toFixed(2)}
                        </span>
                    </div>
                ) : (
                    <div className="text-sm text-gray-500">Please select a package above.</div>
                )}
            </div>

            {/* Order Summary */}
            <div className="space-y-3 py-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">${Number(subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discounts</span>
                    <span className="text-gray-900">-${Number(discounts).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">${Number(tax).toFixed(2)}</span>
                </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center py-4 border-t border-gray-200 border-b">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">${Number(total).toFixed(2)}</span>
            </div>

            {/* Checkout */}
            <button
                onClick={handleCheckout}
                disabled={!selectedPackage}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
                CHECKOUT
            </button>

            {/* Terms + Security */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="terms"
                        className="w-4 h-4 border border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                        I agree to the{" "}
                        <a href="#" className="text-blue-600 hover:underline">
                            Terms of Service
                        </a>
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
