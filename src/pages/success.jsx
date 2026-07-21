import { CheckCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Payment success page that handles post-payment processing
 * Creates customer records, assigns memberships, and generates invoices
 * Uses idempotency checks to prevent duplicate processing
 */
export default function PaymentSuccess() {
    const [status, setStatus] = useState("processing");
    const [message, setMessage] = useState("");
    const [invoiceData, setInvoiceData] = useState(null);
    const [invoiceLoading, setInvoiceLoading] = useState(false);
    const params = new URLSearchParams(window.location.search);

    const sendEmail = async (transactionId) => {
        try {
            const info = JSON.parse(localStorage.getItem("checkoutCustomerInfo") || "{}");
            const pkg = JSON.parse(localStorage.getItem("selectedPackageInfo") || "{}");
            const licencePlateNumber = localStorage.getItem("licensePlate") || "";

            console.log("[Email] Sending email...", { email: info.email, package: pkg.name, type: pkg.type, transactionId });

            if (!info.email) {
                console.warn("[Email] No customer email found, skipping.");
                return;
            }

            const emailRes = await fetch("/.netlify/functions/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerEmail: info.email,
                    customerName: `${info.firstName || ""} ${info.lastName || ""}`.trim(),
                    packageName: pkg.name,
                    packageType: pkg.type,
                    transactionId: transactionId,
                    amount: pkg.price,
                    licensePlate: licencePlateNumber,
                    phoneNumber: info.phone,
                }),
            });

            const emailData = await emailRes.json();
            console.log("[Email] Response:", emailRes.status, emailData);
        } catch (e) {
            console.error("[Email] Failed:", e);
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const status = params.get("status");
        const transactionId = params.get("transactionId");

        console.log("[Email] Page loaded - status:", status, "transactionId:", transactionId);

        if (status !== "success") {
            setStatus("error");
            setMessage("Payment failed or invalid response.");
            return;
        }

        if (transactionId) {
            localStorage.setItem("ipgTransactionId", transactionId);
        }

        setStatus("done");
        setMessage(`Payment Verified. Transaction ID: ${transactionId}`);

        sendEmail(transactionId);
    }, []);

    useEffect(() => {
        const finalize = async () => {
            const transactionId = params.get("transactionId");
            if (!transactionId) return;

            const idempotencyKey = `finalized_${transactionId}`;
            if (localStorage.getItem(idempotencyKey)) {
                console.log("[Finalize] Already finalized, skipping.");
                setStatus("done");
                setMessage("Payment already processed successfully.");
                return;
            }

            try {
                const info = JSON.parse(localStorage.getItem("checkoutCustomerInfo") || "{}");
                const pkg = JSON.parse(localStorage.getItem("selectedPackageInfo") || "{}");
                const siteId = localStorage.getItem("siteId");

                if (!info.email) {
                    console.warn("[Finalize] No customer details.");
                    setStatus("done");
                    setMessage("Payment received.");
                    localStorage.setItem(idempotencyKey, "true");
                    return;
                }

                const base = import.meta.env.VITE_API_BASE_URL;
                const key = localStorage.getItem("apiKey");
                const token = localStorage.getItem("accessToken");

                if (!key || !token) {
                    console.warn("[Finalize] Missing API key or token.");
                    setStatus("done");
                    setMessage("Payment received.");
                    localStorage.setItem(idempotencyKey, "true");
                    return;
                }

                const licencePlateNumber = localStorage.getItem("licensePlate") || "";

                const createCustomerRes = await fetch(`${base}/api/customer`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        key, siteId: siteId || "",
                        firstName: info.firstName, lastName: info.lastName,
                        email: info.email, phoneNumber: info.phone,
                        licencePlateNumber, address: info.address, state: info.state,
                    }),
                });

                const createCustomerData = await createCustomerRes.json();
                if (!createCustomerRes.ok) {
                    console.error("[Finalize] Customer create failed:", createCustomerData);
                    setStatus("done");
                    setMessage("Payment received. Account setup will be completed shortly.");
                    localStorage.setItem(idempotencyKey, "true");
                    return;
                }

                const customerId = createCustomerData.data;
                if (!customerId) {
                    console.error("[Finalize] No customer ID.");
                    setStatus("done");
                    setMessage("Payment received.");
                    localStorage.setItem(idempotencyKey, "true");
                    return;
                }

                let newCustomerId = null;
                try {
                    const secRes = await fetch(`https://blueverse.twotoneagency.me/api/customers/create`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            customerId: customerId || Math.floor(Math.random() * 1000000),
                            firstName: info.firstName, lastName: info.lastName,
                            email: info.email, phoneNumber: info.phone,
                            licencePlateNumber, address: info.address, state: info.state,
                        }),
                    });
                    const secData = await secRes.json();
                    if (secRes.ok) newCustomerId = secData.customer?._id;
                } catch (e) { console.warn("[Finalize] Secondary customer error:", e); }

                let vehicleId = null;
                const licensePlate = String(info.licensePlate || licencePlateNumber || "").trim();

                if (licensePlate) {
                    try {
                        const vehiclesRes = await fetch(
                            `${base}/api/vehicle?key=${key}&customerId=${customerId}&pageSize=999999`,
                            { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
                        );
                        const vehiclesJson = await vehiclesRes.json();
                        const vehicles = Array.isArray(vehiclesJson.data) ? vehiclesJson.data : [];
                        const normalize = (val) => String(val || "").replace(/\s+/g, "").toLowerCase();
                        const lpNorm = normalize(licensePlate);
                        const vehicleWithRFID = vehicles.find((v) => normalize(v.licensePlate) === lpNorm && v.rfid);

                        if (vehicleWithRFID) {
                            vehicleId = vehicleWithRFID.vehicleId || vehicleWithRFID.id || null;
                        } else {
                            const vehiclePayload = {
                                color: "", customerId: String(customerId), description: "",
                                isActive: true, isBlackListed: false, key, licensePlate,
                                specialPricingId: "", vehicleMakeId: "", vehicleModelId: "", year: "",
                            };

                            let vehicleRes = await fetch(`${base}/api/vehicle`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                body: JSON.stringify(vehiclePayload),
                            });

                            const vehicleData = await vehicleRes.json();

                            if (vehicleData.message == "License Plate already associated with another user" || vehicleData.errorMessage?.[0] == "License Plate already associated with another user") {
                                const updatedPayload = { ...vehiclePayload, licensePlate: licensePlate + String(Math.floor(Math.random() * 100)) };
                                vehicleRes = await fetch(`${base}/api/vehicle`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                    body: JSON.stringify(updatedPayload),
                                });
                                if (vehicleRes.ok) {
                                    const updatedData = await vehicleRes.json();
                                    vehicleId = updatedData.data || updatedData.vehicleId || null;
                                }
                            } else if (vehicleRes.ok) {
                                vehicleId = vehicleData.data || vehicleData.vehicleId || null;
                            }
                        }
                    } catch (e) { console.warn("[Finalize] Vehicle error:", e); }
                }

                if (newCustomerId) {
                    try {
                        const createInvoice = await fetch(`https://blueverse.twotoneagency.me/api/invoices/create`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                customer: newCustomerId,
                                serviceDetails: { id: pkg.id, serviceName: pkg.name, price: pkg.price, type: pkg.type },
                                transactionId, discounts: Number(localStorage.getItem("checkoutDiscounts") || 0),
                                state: info.state,
                            }),
                        });
                        if (createInvoice.ok) {
                            const invoiceResponse = await createInvoice.json();
                            setInvoiceData(invoiceResponse.pdfData);
                            setMessage(`Successfully created invoice and sent to ${info.email}`);
                        }
                    } catch (e) { console.warn("[Finalize] Invoice error:", e); }
                }

                if (pkg.type === "membership" && vehicleId) {
                    try {
                        const assignRes = await fetch(`${base}/api/vehicle/assignfreemembership`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body: JSON.stringify({
                                customerId: String(customerId), key,
                                membershipId: String(pkg.id), vehicleId: String(vehicleId),
                            }),
                        });
                        const assignData = await assignRes.json();
                        if (assignRes.ok) {
                            setStatus("done");
                            setMessage("Customer synced & membership assigned successfully.");
                        } else {
                            console.warn("[Finalize] Membership assign failed:", assignData);
                            setMessage("Payment received. Membership will be assigned shortly.");
                        }
                    } catch (e) { console.warn("[Finalize] Membership error:", e); }
                }

                localStorage.setItem(idempotencyKey, "true");
            } catch (err) {
                console.error("[Finalize] Error:", err);
                localStorage.setItem(idempotencyKey, "true");
                setStatus("done");
                setMessage("Payment received successfully.");
            }
        };

        finalize();
    }, []);

    const downloadInvoice = () => {
        if (!invoiceData) return;
        try {
            setInvoiceLoading(true);
            const binaryString = atob(invoiceData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setInvoiceLoading(false);
        } catch (error) {
            console.error('Error downloading invoice:', error);
            setInvoiceLoading(false);
        }
    };

    const printInvoice = () => {
        if (!invoiceData) return;
        try {
            setInvoiceLoading(true);
            const binaryString = atob(invoiceData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
            const blob = new Blob([bytes], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const iframe = document.createElement("iframe");
            iframe.style.position = "fixed";
            iframe.style.right = "0";
            iframe.style.bottom = "0";
            iframe.style.width = "0";
            iframe.style.height = "0";
            iframe.style.border = "0";
            iframe.src = url;
            document.body.appendChild(iframe);
            const cleanup = () => { URL.revokeObjectURL(url); document.body.removeChild(iframe); setInvoiceLoading(false); };
            iframe.onload = () => { setTimeout(() => { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); }, 200); };
            iframe.contentWindow?.addEventListener?.("afterprint", cleanup);
            setTimeout(cleanup, 5000);
        } catch (error) {
            console.error("Error printing invoice:", error);
            setInvoiceLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-green-50 to-blue-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircleIcon className="w-16 h-16 text-green-600" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
                <p className="text-gray-600 mb-8">Thank you for your purchase. Your transaction has been processed successfully.</p>

                <div className="space-y-3">
                    {!invoiceData && status === "done" && (
                        <div className="flex items-center justify-center gap-2 text-gray-600 py-2">
                            <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Preparing your receipt...</span>
                        </div>
                    )}
                    {invoiceData && (
                        <button type="button" onClick={downloadInvoice} disabled={invoiceLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
                            {invoiceLoading ? "Downloading..." : "Download Receipt"}
                        </button>
                    )}
                    {invoiceData && (
                        <button type="button" onClick={printInvoice} disabled={invoiceLoading}
                            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg">
                            {invoiceLoading ? "Preparing..." : "Print Receipt"}
                        </button>
                    )}
                    <button onClick={() => (window.location.href = "https://blueverse.ae/")}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Go Back
                    </button>
                </div>

                <div className="mt-4">
                    {status === "processing" && <p className="text-gray-600">Finalizing your account. Please wait a moment...</p>}
                    {status === "done" && <p className="text-green-700">{message || "Your payment has been processed successfully."}</p>}
                </div>
            </div>
        </div>
    );
}
