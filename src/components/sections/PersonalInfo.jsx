"use client"

export default function PersonalInfo({ formData, onChange, onToggle, siteData }) {
    const sites = Array.isArray(siteData?.data) ? siteData.data : [];

    // Unique states from all sites
    const stateOptions = [...new Set(sites.map(s => s?.stateName).filter(Boolean))];

    // Cities from the selected site only (if selected)
    const selectedSite = sites.find(
        s => String(s?.id ?? s?.siteId) === String(formData.assignToLocSite)
    );
    const cityOptions = selectedSite?.cityName ? [selectedSite.cityName] : [];

    return (
        <div>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        First name<span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="firstName"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={onChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone number</label>
                    <input
                        type="tel"
                        name="phone"
                        placeholder="Phone number"
                        value={formData.phone}
                        onChange={onChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last name<span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="lastName"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={onChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={onChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of birth</label>
                    <input
                        type="date"
                        name="dateOfBirth"
                        placeholder="Select date"
                        value={formData.dateOfBirth}
                        onChange={onChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                        type="text"
                        name="address"
                        placeholder="Address line"
                        value={formData.address}
                        onChange={onChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assign to Loc/Site<span className="text-red-500">*</span>
                    </label>
                    <select
                        name="assignToLocSite"
                        value={formData.assignToLocSite}
                        onChange={onChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        <option value="">Select Loc/Site</option>
                        {sites.map((site, idx) => (
                            <option
                                key={site?.id ?? site?.siteId ?? idx}
                                value={site?.id ?? site?.siteId ?? `location${idx + 1}`}
                            >
                                {site?.siteName ?? `Site ${idx + 1}`}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ZIP code</label>
                    <input
                        type="text"
                        name="zipCode"
                        placeholder="Add ZIP code"
                        value={formData.zipCode}
                        onChange={onChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <select
                        name="state"
                        value={formData.state}
                        onChange={onChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        <option value="">Select state</option>
                        {stateOptions.map((st) => (
                            <option key={st} value={st}>{st}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <select
                        name="city"
                        value={formData.city}
                        onChange={onChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        <option value="">Select city</option>
                        {cityOptions.map((city) => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loyalty points amount</label>
                    <input
                        type="text"
                        name="loyaltyPoints"
                        placeholder="Loyalty points"
                        value={formData.loyaltyPoints}
                        onChange={onChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                    <label className="text-sm font-medium text-gray-700">Allow invoicing</label>
                    <button
                        type="button"
                        onClick={() => onToggle("allowInvoicing")}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.allowInvoicing ? "bg-blue-500" : "bg-gray-300"
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.allowInvoicing ? "translate-x-6" : "translate-x-1"
                                }`}
                        />
                    </button>
                </div>
                <div className="flex items-center justify-between py-2">
                    <label className="text-sm font-medium text-gray-700">Send text</label>
                    <button
                        type="button"
                        onClick={() => onToggle("sendText")}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.sendText ? "bg-blue-500" : "bg-gray-300"
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.sendText ? "translate-x-6" : "translate-x-1"
                                }`}
                        />
                    </button>
                </div>
                <div className="flex items-center justify-between py-2">
                    <label className="text-sm font-medium text-gray-700">Send email</label>
                    <button
                        type="button"
                        onClick={() => onToggle("sendEmail")}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.sendEmail ? "bg-blue-500" : "bg-gray-300"
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.sendEmail ? "translate-x-6" : "translate-x-1"
                                }`}
                        />
                    </button>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-200 pt-4">
                    <label className="text-sm font-medium text-gray-700">TCPA enabled</label>
                    <span className="text-sm text-gray-600">No</span>
                </div>
                <div className="flex items-center justify-between py-2">
                    <label className="text-sm font-medium text-gray-700">Blacklisted customer</label>
                    <button
                        type="button"
                        onClick={() => onToggle("blacklistedCustomer")}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.blacklistedCustomer ? "bg-blue-500" : "bg-gray-300"
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.blacklistedCustomer ? "translate-x-6" : "translate-x-1"
                                }`}
                        />
                    </button>
                </div>
                <div className="flex items-center justify-between py-2">
                    <label className="text-sm font-medium text-gray-700">Active customer</label>
                    <button
                        type="button"
                        onClick={() => onToggle("activeCustomer")}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.activeCustomer ? "bg-blue-500" : "bg-gray-300"
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.activeCustomer ? "translate-x-6" : "translate-x-1"
                                }`}
                        />
                    </button>
                </div>
            </div>
        </div>
    )
}
