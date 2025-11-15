"use client";

import { useEffect, useState } from "react";
import { useCheckout } from "../context/CheckoutContext";
import { CheckCircleIcon } from "lucide-react";

export default function PaymentSuccess() {
    const [status, setStatus] = useState("processing");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const finalize = async () => {
            try {
                const info = JSON.parse(localStorage.getItem("checkoutCustomerInfo") || "{}");
                const pkg = JSON.parse(localStorage.getItem("selectedPackageInfo") || "{}");
                const siteId = localStorage.getItem("siteId");
                console.log(pkg, info);

                if (!info.email) {
                    setStatus("error");
                    setMessage("No saved customer details found.");
                    return;
                }

                const base = import.meta.env.VITE_API_BASE_URL;
                const key = localStorage.getItem("apiKey");
                console.log(key);

                const token = localStorage.getItem("accessToken");

                // 1) Check if customer exists
                const listRes = await fetch(`${base}/api/customer?key=${key}`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                });

                const json = await listRes.json();
                const customers = Array.isArray(json.data) ? json.data : [];

                let customerId = null;

                const existing = customers.find(
                    c => String(c.emailId).toLowerCase() === info.email.toLowerCase()
                );

                if (existing) {
                    customerId = existing.customerId;
                } else {
                    // 2) Create customer
                    const createBody = {
                        key,
                        siteId,
                        firstName: info.firstName,
                        lastName: info.lastName,
                        address: info.address,
                        stateId: 54,
                        cityId: 0,
                        status: "Paid",
                        zipCode: info.zipCode,
                        emailId: info.email,
                        phone: info.phone,
                        allowInvoicing: false,
                        loyaltyPoints: 0,
                        isCardOnFile: false,
                        blackList: false,
                        isActive: true,
                        source: "web"
                    };

                    const createRes = await fetch(`${base}/api/customer`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify(createBody)
                    });

                    const cdata = await createRes.json();
                    customerId = cdata.data;
                }

                // 3) Create Invoice (Membership or Washbook)
                const invoiceUrl = pkg.type === "membership"
                    ? `${base}/api/external/chargecardandcreateinvoice`
                    : `${base}/api/invoice`;

                const invoicePayload = {
                    source: "Web",
                    paymentRequest: {
                        key,
                        siteId,
                        token: accessToken,
                        amount: pkg.price,
                        recurringData: "",
                        invoiceNo: `INV-${Date.now()}`,
                        cToken: "",
                        zipCode: info.zipCode || "00000",
                    },
                    invoiceRequest: {
                        key,
                        source: "Web",
                        invoiceNumber: `INV-${Date.now()}`,
                        siteId,
                        status: "Paid",
                        totalAmount: pkg.price,
                        amountDue: 0,
                        subtotal: pkg.price,
                        redemptions: 0,
                        discounts: 0,
                        tax: 0,
                        status: "Paid",
                        source: "Web",
                        siteLaneId: 1,
                        isGateEnabled: false,
                        isActive: true,
                        membershipSaleList:
                            pkg.type === "membership"
                                ? [{ membershipId: pkg.id, isNewSignUp: true }]
                                : [],
                        washbookSaleList:
                            pkg.type === "washbook"
                                ? [{ washbookId: pkg.id, washbookNumber: "ONLINE" }]
                                : [],
                        paymentTypeList: [
                            {
                                paymentMode: "CreditCard",
                                amount: pkg.price,
                                referenceNumber: String(Date.now()),
                                paymentTypeCcDetails: {}
                            }
                        ],
                        customerData: { customerId },
                        vehicleData: {}
                    }
                };

                const invRes = await fetch(invoiceUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(invoicePayload)
                });
                const invData = await invRes.json();
                console.log(invData, "invoice data");
                setStatus("done");
                setMessage("Customer synced & invoice created successfully.");

            } catch (err) {
                console.error(err);
                setStatus("error");
                setMessage("Error finalizing transaction.");
            }
        };

        finalize();
    }, []);


    return (
        <div className="min-h-screen bg-linear-to-br from-green-50 to-blue-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircleIcon className="w-16 h-16 text-green-600" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Payment Successful!
                </h1>

                <p className="text-gray-600 mb-8">
                    Thank you for your purchase. Your transaction has been processed
                    successfully.
                </p>

                <button
                    onClick={() =>
                    (window.location.href =
                        "https://wheat-ferret-827560.hostingersite.com/")
                    }
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

                <div className="mt-4">
                    {status === "processing" && (
                        <p className="text-gray-600">
                            Finalizing your account. Please wait a moment...
                        </p>
                    )}

                    {status === "done" && (
                        <p className="text-green-700">
                            {message || "Your payment has been processed successfully."}
                        </p>
                    )}

                    {status === "no-data" && (
                        <p className="text-gray-600">
                            Payment completed, but no stored customer information was found.
                        </p>
                    )}

                    {status === "error" && (
                        <p className="text-red-600">
                            {message ||
                                "Payment succeeded, but something went wrong while saving your details."}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
