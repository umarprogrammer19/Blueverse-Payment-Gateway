import { CheckCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";

// Payment Success
export default function PaymentSuccess() {
    const [status, setStatus] = useState("processing");
    const [message, setMessage] = useState("");
    const [invoiceData, setInvoiceData] = useState(null);
    const [invoiceLoading, setInvoiceLoading] = useState(false);
    const params = new URLSearchParams(window.location.search);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const status = params.get("status");
        const transactionId = params.get("transactionId");

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
    }, []);

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

                // 1) Customer create
                const licencePlateNumber = localStorage.getItem("licensePlate") || "";

                const createCustomerPayload = {
                    key: key,
                    siteId: siteId || "",
                    firstName: info.firstName,
                    lastName: info.lastName,
                    email: info.email,
                    phoneNumber: info.phone, // Assuming 'phone' from info is phoneNumber
                    licencePlateNumber: licencePlateNumber,
                    address: info.address,
                    state: info.state, // Assuming 'state' from info
                };

                const createCustomerRes = await fetch(`${base}/api/customer`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(createCustomerPayload),
                });

                const createCustomerData = await createCustomerRes.json();

                if (!createCustomerRes.ok) {
                    setStatus("error");
                    setMessage(`Error creating customer: ${createCustomerData.message || createCustomerRes.statusText}`);
                    return;
                }

                const customerId = createCustomerData.data;

                if (!customerId) {
                    setStatus("error");
                    setMessage("Unable to get customer ID after creation.");
                    return;
                }

                const createCustomerResponseForInvoice = await fetch(`https://blueverse.projectsutility.com/api/customers/create`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        customerId: customerId || Math.floor(Math.random() * 1000000),
                        firstName: createCustomerPayload.firstName,
                        lastName: createCustomerPayload.lastName,
                        email: createCustomerPayload.email,
                        phoneNumber: createCustomerPayload.phoneNumber,
                        licencePlateNumber: createCustomerPayload.licencePlateNumber,
                        address: createCustomerPayload.address,
                        state: createCustomerPayload.state,
                    }),
                });

                const createCustomerResponseForInvoiceData = await createCustomerResponseForInvoice.json();

                if (!createCustomerResponseForInvoice.ok) {
                    setStatus("error");
                    setMessage(`Error creating customer: ${createCustomerData.message || createCustomerRes.statusText}`);
                    return;
                }

                const newCustomerId = createCustomerResponseForInvoiceData.customer._id;

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

                    if (!vehicleRes.ok) {
                        setStatus("error");
                        setMessage("Error creating vehicle for this license plate.");
                        return;
                    }

                    vehicleId = vehicleData.data || vehicleData.vehicleId || null;
                    const transactionId = params.get("transactionId"); // Already retrieved earlier in useEffect
                    const discounts = localStorage.getItem("checkoutDiscounts") || 0; // Retrieved from localStorage

                    const createInvoice = await fetch(`https://blueverse.projectsutility.com/api/invoices/create`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            customer: newCustomerId,
                            serviceDetails: {
                                id: pkg.id,
                                serviceName: pkg.name,
                                price: pkg.price,
                                type: pkg.type,
                            },
                            transactionId: transactionId,
                            discounts: Number(discounts),
                            state: info.state,
                        }),
                    });

                    if (createInvoice.ok) {
                        const invoiceResponse = await createInvoice.json();
                        setInvoiceData(invoiceResponse.pdfData); // Store the PDF data
                        setMessage(`Successfully created invoice and sent to ${createCustomerPayload.email}`)
                    } else {
                        setMessage(`Failed to create invoice: ${createInvoice.statusText}`)
                    }

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
                    // 3) Invoice create
                    const transactionId = params.get("transactionId"); // Already retrieved earlier in useEffect
                    const discounts = localStorage.getItem("checkoutDiscounts") || 0; // Retrieved from localStorage

                    const createInvoicePayload = {
                        customer: newCustomerId,
                        serviceDetails: {
                            id: pkg.id,
                            serviceName: pkg.name,
                            price: pkg.price,
                            type: pkg.type,
                        },
                        transactionId: transactionId,
                        discounts: Number(discounts),
                        state: info.state,
                    };
                    // Invoice
                    const createInvoiceRes = await fetch(`https://blueverse.projectsutility.com/api/invoices/create`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(createInvoicePayload),
                    });

                    if (createInvoiceRes.ok) {
                        const createInvoiceData = await createInvoiceRes.json();
                        setInvoiceData(createInvoiceData.pdfData); // Store the PDF data
                        setStatus("done");
                        setMessage("Customer synced & invoice created successfully.");
                    } else {
                        const errorData = await createInvoiceRes.json();
                        setStatus("error");
                        setMessage(`Error creating invoice: ${errorData.message || createInvoiceRes.statusText}`);
                        return;
                    }
                }
            } catch (err) {
                console.error(err);
                setStatus("error");
                setMessage("Error finalizing transaction.");
            }
        };

        finalize();
    }, []);

    const downloadInvoice = () => {
        if (!invoiceData) return;

        try {
            setInvoiceLoading(true);

            // Convert base64 to binary data
            const binaryString = atob(invoiceData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Create a Blob from the binary data
            const blob = new Blob([bytes], { type: 'application/pdf' });

            // Create a download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();

            // Clean up
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setInvoiceLoading(false);
        } catch (error) {
            console.error('Error downloading invoice:', error);
            setInvoiceLoading(false);
            setMessage('Error downloading invoice. Please try again.');
        }
    };

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

                <div className="space-y-3">
                    {invoiceData && (
                        <button
                            type="button"
                            onClick={downloadInvoice}
                            disabled={invoiceLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                            {invoiceLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Downloading...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download Receipt
                                </>
                            )}
                        </button>
                    )}
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
                </div>

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

                    {/* {status === "error" && (
                        <p className="text-red-600">
                            {message ||
                                "Payment succeeded, but something went wrong while saving your details."}
                        </p>
                    )} */}
                </div>
            </div>
        </div>
    );
}
