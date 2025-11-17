"use client";

import CryptoJS from "crypto-js";
import moment from "moment-timezone";
import { useMemo, useState } from "react";

export default function PurchaseSummary({
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
    responseFailURL = "https://blueverse-checkout.netlify.app/.netlify/functions/ipg-fail",
    responseSuccessURL = "https://blueverse-checkout.netlify.app/.netlify/functions/ipg-success",
    transactionNotificationURL = "",
    expirationDate = null,
    isUsed = false,
    isProcessing = false,
}) {
    const [timezone, setTimezone] = useState("Asia/Dubai");
    const [txntype, setTxntype] = useState(defaultTxnType);
    const [currency, setCurrency] = useState(defaultCurrency);
    const [paymentMethod, setPaymentMethod] = useState(defaultPaymentMethod);
    const [checkoutoption, setCheckoutoption] = useState(defaultCheckoutOption);
    const [oid, setOid] = useState("");

    const [couponError, setCouponError] = useState("");
    const [termsAccepted, setTermsAccepted] = useState(false); // ✅ NEW

    const txndatetime = useMemo(() => {
        return moment().tz(timezone).format("YYYY:MM:DD-HH:mm:ss");
    }, [timezone]);

    const chargeTotal = useMemo(() => {
        const val = Number(total ?? 0);
        return val.toFixed(2);
    }, [total]);

    function createSignature(paymentParams, secret) {
        const ignore = new Set(["hashExtended"]);
        const sortedKeys = Object.keys(paymentParams)
            .filter((k) => paymentParams[k] !== "" && !ignore.has(k))
            .sort();

        const messageSignatureContent = sortedKeys.map((k) =>
            String(paymentParams[k])
        );
        const raw = messageSignatureContent.join("|");
        const hmac = CryptoJS.HmacSHA256(raw, secret);
        return CryptoJS.enc.Base64.stringify(hmac);
    }
    const isMembership = !!selectedPackage?.membershipId;

    function buildPaymentParams() {
        const base = {
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

        if (isMembership) {
            // number of installments: example 12 months plan
            base.recurringInstallmentCount = 12;

            // period: 'day' | 'week' | 'month' | 'year'
            base.recurringInstallmentPeriod = "month";

            // frequency: number of payment in a period
            base.recurringInstallmentFrequency = 1; 
        }

        return base;
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

    const handleCheckout = async () => {
        // ✅ hard guard
        if (!termsAccepted) return;

        if (typeof onCheckout === "function") {
            try {
                const result = await onCheckout();
                if (result === false) return; // validation failed upstream
            } catch (err) {
                console.error("onCheckout error:", err);
                return;
            }
        }
        submitToIPG();
    };

    // coupon validation
    function validateCoupon() {
        if (!expirationDate && !isUsed) {
            setCouponError("");
            return true;
        }

        if (expirationDate) {
            const now = moment();
            const exp = moment(expirationDate);

            if (exp.isBefore(now)) {
                setCouponError("This coupon has expired.");
                return false;
            }
        }

        if (isUsed) {
            setCouponError("This coupon has already been used.");
            return false;
        }

        setCouponError("");
        return true;
    }

    const handleApplyCouponClick = () => {
        const isValid = validateCoupon();
        if (!isValid) return;

        if (typeof onApplyCoupon === "function") {
            onApplyCoupon();
        }
    };

    const selectedName =
        selectedPackage?.washbookName || selectedPackage?.membershipName || "";
    const selectedPrice = selectedPackage
        ? Number(
            selectedPackage.washbookPrice ?? selectedPackage.membershipPrice ?? 0
        )
        : 0;

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
                        onClick={handleApplyCouponClick}
                        type="button"
                        className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                    >
                        Apply
                    </button>
                </div>

                {couponError && (
                    <p className="mt-1 text-sm text-red-600">{couponError}</p>
                )}
            </div>

            {/* Selected Package */}
            <div className="space-y-2">
                <h4 className="font-semibold">Selected package</h4>
                {selectedPackage ? (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-700">{selectedName}</span>
                        <span className="text-gray-900">
                            د.إ{selectedPrice.toFixed(2)}
                        </span>
                    </div>
                ) : (
                    <div className="text-sm text-gray-500">
                        Please select a package above.
                    </div>
                )}
            </div>

            {/* Order Summary */}
            <div className="space-y-3 py-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">
                        د.إ{Number(subtotal).toFixed(2)}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discounts</span>
                    <span className="text-gray-900">
                        -د.إ{Number(discounts).toFixed(2)}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">
                        د.إ{Number(tax).toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center py-4 border-t border-gray-200 border-b">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">
                    د.إ{Number(total).toFixed(2)}
                </span>
            </div>

            {/* ✅ Terms of service must be accepted */}
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="terms"
                    required
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 border border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                    I agree to the{" "}
                    <a href="#" className="text-blue-600 hover:underline">
                        Terms of Service
                    </a>
                </label>
            </div>

            {/* Checkout */}
            <button
                onClick={handleCheckout}
                disabled={!selectedPackage || isProcessing || !termsAccepted}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
                {isProcessing ? "Processing..." : "CHECKOUT"}
            </button>
        </div>
    );
}
