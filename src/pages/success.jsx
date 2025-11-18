"use client";

import { CheckCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function PaymentSuccess() {
    const [status, setStatus] = useState("processing");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const finalize = async () => {
            try {
                const info = JSON.parse(
                    localStorage.getItem("checkoutCustomerInfo") || "{}"
                );
                const pkg = JSON.parse(
                    localStorage.getItem("selectedPackageInfo") || "{}"
                );
                const siteId = localStorage.getItem("siteId");

                console.log("pkg/info", pkg, info);

                if (!info.email) {
                    setStatus("error");
                    setMessage("No saved customer details found.");
                    return;
                }

                const base = import.meta.env.VITE_API_BASE_URL;
                const key = localStorage.getItem("apiKey");
                const token = localStorage.getItem("accessToken");

                if (!key || !token) {
                    setStatus("error");
                    setMessage("Missing API key or token.");
                    return;
                }

                // 1) Customer resolve / create
                const listRes = await fetch(`${base}/api/customer?key=${key}`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                const json = await listRes.json();
                const customers = Array.isArray(json.data) ? json.data : [];

                let customerId = null;

                const existing = customers.find(
                    (c) => {
                        console.log(c);
                        console.log(c.emailId, info.email, info,"___________________");

                        return c.emailId === info.email
                    }
                );

                console.log(existing);

                if (existing) {
                    customerId = existing.customerId;
                } else {
                    const createBody = {
                        key,
                        siteId,
                        firstName: info.firstName,
                        lastName: info.lastName,
                        address: info.address,
                        stateId: 54,
                        cityId: 0,
                        status: "paid",
                        zipCode: info.zipCode,
                        emailId: info.email,
                        phone: info.phone,
                        allowInvoicing: false,
                        loyaltyPoints: 0,
                        isCardOnFile: false,
                        blackList: false,
                        isActive: true,
                        source: "web",
                    };

                    const createRes = await fetch(`${base}/api/customer`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(createBody),
                    });

                    const cdata = await createRes.json();
                    customerId = cdata.data;
                }

                if (!customerId) {
                    setStatus("error");
                    setMessage("Unable to resolve customer id.");
                    return;
                }

                // 2) Vehicle / RFID logic
                //    - license plate localStorage + info se
                //    - RFID exist ho to error
                //    - warna naya vehicle POST, jis se vehicleId milega
                const rawLp =
                    info.licensePlate || localStorage.getItem("licensePlate") || "";
                const licensePlate = String(rawLp).trim();
                let vehicleId = null;

                if (licensePlate) {
                    const vehiclesRes = await fetch(
                        `${base}/api/vehicle?key=${key}&customerId=${customerId}&pageSize=999999`,
                        {
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );

                    const vehiclesJson = await vehiclesRes.json();
                    const vehicles = Array.isArray(vehiclesJson.data)
                        ? vehiclesJson.data
                        : [];

                    const normalize = (val) =>
                        String(val || "").replace(/\s+/g, "").toLowerCase();
                    const lpNorm = normalize(licensePlate);

                    const vehicleWithRFID = vehicles.find(
                        (v) => normalize(v.licensePlate) === lpNorm && v.rfid
                    );

                    if (vehicleWithRFID) {
                        console.warn("RFID already exists for this license plate", {
                            vehicleWithRFID,
                        });
                        setStatus("error");
                        setMessage(
                            "A vehicle with this license plate already has an RFID assigned."
                        );
                        return;
                    }

                    // naya vehicle create karo (RFID = licensePlate)
                    const vehiclePayload = {
                        color: "",
                        customerId: String(customerId),
                        description: "",
                        isActive: true,
                        isBlackListed: false,
                        key,
                        licensePlate,
                        rfid: licensePlate,
                        specialPricingId: "",
                        vehicleMakeId: "",
                        vehicleModelId: "",
                        year: "",
                    };

                    const vehicleRes = await fetch(`${base}/api/vehicle`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(vehiclePayload),
                    });

                    const vehicleData = await vehicleRes.json();
                    console.log("vehicle create:", vehicleData);

                    if (!vehicleRes.ok) {
                        setStatus("error");
                        setMessage("Error creating vehicle for this license plate.");
                        return;
                    }

                    vehicleId = vehicleData.data || vehicleData.vehicleId || null;
                } else {
                    console.warn("No license plate provided – vehicle step skipped.");
                }

                const isMembership = pkg.type === "membership";

                // 3) Branch: membership vs washbook
                if (isMembership) {
                    // membership = /api/vehicle/assignfreemembership
                    if (!vehicleId) {
                        setStatus("error");
                        setMessage("Unable to resolve vehicle for this membership.");
                        return;
                    }

                    const assignPayload = {
                        customerId: String(customerId),
                        key,
                        membershipId: String(pkg.id), // selectedPackageInfo.id = membershipId
                        vehicleId: String(vehicleId),
                    };

                    console.log("assignfreemembership payload:", assignPayload);

                    const assignRes = await fetch(
                        `${base}/api/vehicle/assignfreemembership`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify(assignPayload),
                        }
                    );

                    const assignData = await assignRes.json();
                    console.log("assignfreemembership resp:", assignData);

                    if (!assignRes.ok) {
                        setStatus("error");
                        setMessage("Failed to assign membership to vehicle.");
                        return;
                    }

                    setStatus("done");
                    setMessage(
                        "Customer synced & membership assigned to vehicle successfully."
                    );
                } else {
                    const invoiceUrl = `${base}/api/washbook/customerwashbooks`;

                    const invoicePayload = {
                        washbookId: pkg.id,
                        washbookNumber: Math.floor(100000 + Math.random() * 900000),
                        numberOfWashes: 2,
                        customerId,
                        siteId,
                        key,
                        isActive: true,
                        expirationDate: pkg.expirationDate,
                    };

                    console.log("washbook payload:", invoicePayload);

                    const invRes = await fetch(invoiceUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(invoicePayload),
                    });

                    const invData = await invRes.json();
                    console.log("washbook invoice resp:", invData);

                    if (!invRes.ok) {
                        setStatus("error");
                        setMessage("Error creating washbook entry.");
                        return;
                    }

                    setStatus("done");
                    setMessage("Customer synced & washbook created successfully.");
                }
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
