"use client";

import { useEffect, useState } from "react";
import { useCheckout } from "../context/CheckoutContext";
import { CheckCircleIcon } from "lucide-react";

export default function PaymentSuccess() {
    const { setCustomerId, setSiteId, apiKey } = useCheckout();
    const [status, setStatus] = useState("processing");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const run = async () => {
            try {
                const stored = localStorage.getItem("checkoutCustomerInfo");
                if (!stored) {
                    setStatus("no-data");
                    setMessage(
                        "Payment completed, but no stored customer information was found."
                    );
                    return;
                }

                const info = JSON.parse(stored || "{}");

                const base = import.meta.env.VITE_API_BASE_URL;
                const token = localStorage.getItem("accessToken");
                const key = apiKey || localStorage.getItem("apiKey") || "";

                if (!token || !key) {
                    setStatus("error");
                    setMessage("Missing API credentials. Please contact support.");
                    return;
                }

                const email = (info.email || info.emailId || "").trim().toLowerCase();
                if (!email) {
                    setStatus("error");
                    setMessage("Stored customer information does not include an email.");
                    return;
                }

                // 1) check existing customers
                const listRes = await fetch(`${base}/api/customer?key=${key}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                const listData = await listRes.json();
                const customers = Array.isArray(listData?.data) ? listData.data : [];
                const existing = customers.find(
                    (c) => String(c.emailId || "").toLowerCase() === email
                );

                if (existing) {
                    const cid = existing.customerId;
                    if (cid) {
                        setCustomerId(cid);
                        localStorage.setItem("customerId", String(cid));
                    }
                    if (info.assignToLocSite) {
                        setSiteId(info.assignToLocSite);
                        localStorage.setItem("siteId", String(info.assignToLocSite));
                    }
                    setStatus("done");
                    setMessage("Customer already exists. Linked payment to your account.");
                    return;
                }

                // 2) create new customer
                const body = {
                    key,
                    address: info.address || "",
                    allowInvoicing: !!info.allowInvoicing,
                    blackList: !!info.blacklistedCustomer,
                    ccNumber: "",
                    ccToken: "",
                    ccType: "",
                    cityId: 0,
                    dateOfBirth: info.dateOfBirth
                        ? `${info.dateOfBirth}T00:00:00`
                        : null,
                    emailId: info.email || "",
                    expiryMonth: "",
                    expiryYear: "",
                    firstName: info.firstName || "",
                    isActive: true,
                    isCardOnFile: false,
                    isSendEmail: !!info.sendEmail,
                    isSendText: !!info.sendText,
                    isTcpaEnabled: false,
                    lastName: info.lastName || "",
                    loyaltyPoints: Number(info.loyaltyPoints || 0),
                    nameOnCard: "",
                    phone: info.phone || "",
                    recurringData: "",
                    siteId: String(info.assignToLocSite || ""),
                    stateId: 54,
                    zipCode: info.zipCode || "",
                };

                const createRes = await fetch(`${base}/api/customer`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(body),
                });

                const createData = await createRes.json();
                if (!createRes.ok) {
                    console.error("Create customer on success failed:", createData);
                    setStatus("error");
                    setMessage(
                        "Payment succeeded but customer account could not be created."
                    );
                    return;
                }

                const newId = createData?.data?.customerId;
                if (newId) {
                    setCustomerId(newId);
                    localStorage.setItem("customerId", String(newId));
                }
                if (info.assignToLocSite) {
                    setSiteId(info.assignToLocSite);
                    localStorage.setItem("siteId", String(info.assignToLocSite));
                }

                setStatus("done");
                setMessage("Customer created successfully after payment.");
            } catch (err) {
                console.error("Success page customer sync error:", err);
                setStatus("error");
                setMessage(
                    "Payment succeeded but there was an error finalizing your account."
                );
            }
        };

        run();
    }, [apiKey, setCustomerId, setSiteId]);

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
