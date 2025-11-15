"use client";

import { useState } from "react";

export default function PersonalInfo({ formData, onChange, siteData }) {
    const sites = Array.isArray(siteData?.data) ? siteData.data : [];
    const [selectedSiteId, setSelectedSiteId] = useState(formData.assignToLocSite || "");

    const stateOptions = [...new Set(sites.map(s => s?.stateName).filter(Boolean))].sort();

    const selectedSite = sites.find(
        s => String(s?.id ?? s?.siteId) === String(selectedSiteId || formData.assignToLocSite)
    );

    const cityOptions = selectedSite?.cityName ? [selectedSite.cityName] : [];

    const handleSiteChange = (e) => {
        const value = e.target.value;
        setSelectedSiteId(value);
        onChange(e); // Trigger parent onChange
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Personal Information</h2>

            {/* Personal Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                        First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="firstName"
                        type="text"
                        name="firstName"
                        placeholder="Enter first name"
                        required
                        value={formData.firstName || ""}
                        onChange={onChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                </div>

                <div>
                    <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                        Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="lastName"
                        type="text"
                        name="lastName"
                        placeholder="Enter last name"
                        required
                        value={formData.lastName || ""}
                        onChange={onChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
                    <input type="email" name="email" required placeholder="Email address" value={formData.email} onChange={onChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="phone"
                        type="tel"
                        name="phone"
                        placeholder="Enter phone number (e.g., +1 234 567 8900)"
                        required
                        value={formData.phone || ""}
                        onChange={onChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                </div>

                <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                        Address
                    </label>
                    <input
                        id="address"
                        type="text"
                        name="address"
                        placeholder="Enter full address"
                        value={formData.address || ""}
                        onChange={onChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                </div>
            </div>

            {/* Location Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Site Selection */}
                <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">
                        Select Site <span className="text-red-500">*</span>
                    </label>
                    <fieldset className="space-y-3 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
                        {sites.length > 0 ? (
                            sites.map((site, idx) => {
                                const siteValue = site?.id ?? site?.siteId;
                                return (
                                    <label key={siteValue || idx} className="flex items-center p-2 hover:bg-white rounded cursor-pointer transition-colors">
                                        <input
                                            type="radio"
                                            name="assignToLocSite"
                                            value={siteValue}
                                            checked={String(selectedSiteId || formData.assignToLocSite) === String(siteValue)}
                                            onChange={handleSiteChange}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                        <span className="ml-3 text-sm font-medium text-gray-900">{site?.siteName ?? `Site ${idx + 1}`}</span>
                                    </label>
                                );
                            })
                        ) : (
                            <p className="text-sm text-gray-500 italic p-2">No sites available.</p>
                        )}
                    </fieldset>
                </div>

                {/* State Selection */}
                <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">
                        State
                    </label>
                    <fieldset className="space-y-3 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
                        {stateOptions.length > 0 ? (
                            stateOptions.map((st, idx) => (
                                <label key={idx} className="flex items-center p-2 hover:bg-white rounded cursor-pointer transition-colors">
                                    <input
                                        type="radio"
                                        name="state"
                                        value={st}
                                        checked={formData.state === st}
                                        onChange={onChange}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-900">{st}</span>
                                </label>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic p-2">No states available.</p>
                        )}
                    </fieldset>
                </div>

                {/* City Selection */}
                <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">
                        City
                    </label>
                    <fieldset className="space-y-3 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
                        {cityOptions.length > 0 ? (
                            cityOptions.map((city, idx) => (
                                <label key={idx} className="flex items-center p-2 hover:bg-white rounded cursor-pointer transition-colors">
                                    <input
                                        type="radio"
                                        name="city"
                                        value={city}
                                        checked={formData.city === city}
                                        onChange={onChange}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-900">{city}</span>
                                </label>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic p-2">Select a site to view cities.</p>
                        )}
                    </fieldset>
                </div>
            </div>
        </div>
    );
}