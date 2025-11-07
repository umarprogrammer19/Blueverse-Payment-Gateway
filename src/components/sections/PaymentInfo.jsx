"use client"

import { Eye, EyeOff } from "lucide-react"

export default function PaymentInfo({ formData, onChange, showSecurity, setShowSecurity }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card number<span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="cardNumber"
                        placeholder="Card number"
                        value={formData.cardNumber}
                        onChange={onChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiration date<span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="expirationDate"
                        placeholder="Expiration date"
                        value={formData.expirationDate}
                        onChange={onChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Security code<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type={showSecurity ? "text" : "password"}
                            name="securityCode"
                            placeholder="Security code"
                            value={formData.securityCode}
                            onChange={onChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setShowSecurity(!showSecurity)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                            {showSecurity ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Billing ZIP code<span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="billingZip"
                        placeholder="Billing ZIP code"
                        value={formData.billingZip}
                        onChange={onChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
            </div>
        </div>
    )
}
