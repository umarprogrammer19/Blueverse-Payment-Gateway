import { useEffect, useState } from 'react';

/**
 * Car information component for collecting vehicle license plate details
 * @param {Object} formData - Form data containing car information
 * @param {Function} onChange - Handler for form input changes
 */
export default function CarInfo({ formData, onChange }) {
    // State variables for car information
    const [selectedRegion, setSelectedRegion] = useState(formData.region || 'Emirates'); // Selected region (Emirates or GCC)
    const [selectedCountry, setSelectedCountry] = useState(formData.country || (formData.region === 'Emirates' ? 'Dubai' : '')); // Selected country/emirate
    const [alphabeticPart, setAlphabeticPart] = useState(formData.alphabeticPart || ''); // Alphabetic part of license plate
    const [numericPart, setNumericPart] = useState(formData.numericPart || ''); // Numeric part of license plate

    // Effects to sync state changes with parent form
    useEffect(() => {
        onChange({
            target: {
                name: 'region',
                value: selectedRegion,
            },
        });
    }, [selectedRegion]);

    useEffect(() => {
        onChange({
            target: {
                name: 'country',
                value: selectedCountry,
            },
        });
    }, [selectedCountry]);

    useEffect(() => {
        onChange({
            target: {
                name: 'alphabeticPart',
                value: alphabeticPart,
            },
        });
    }, [alphabeticPart]);

    useEffect(() => {
        onChange({
            target: {
                name: 'numericPart',
                value: numericPart,
            },
        });
    }, [numericPart]);

    /**
     * Handles region selection changes
     * Resets country and license plate parts when region changes
     */
    const handleRegionChange = (e) => {
        const value = e.target.value;
        setSelectedRegion(value);
        setSelectedCountry(''); // Reset country when region changes
        setAlphabeticPart('');
        setNumericPart('');
    };

    /**
     * Handles country selection changes
     */
    const handleCountryChange = (e) => {
        setSelectedCountry(e.target.value);
    };

    /**
     * Handles alphabetic part of license plate changes
     * Converts input to uppercase
     */
    const handleAlphabeticPartChange = (e) => {
        setAlphabeticPart(e.target.value.toUpperCase());
    };

    /**
     * Handles numeric part of license plate changes
     */
    const handleNumericPartChange = (e) => {
        setNumericPart(e.target.value);
    };

    // Countries for UAE Emirates region
    const emiratesCountries = [
        'Abu Dhabi',
        'Ajman',
        'Dubai',
        'Fujairah',
        'Ras Al Khaimah',
        'Sharjah',
        'Umm Al Quwain',
    ];

    // Countries for GCC region
    const gccCountries = [
        'KSA',
        'Bahrain',
        'Kuwait',
        'Oman',
        'Qatar',
        'United Arab Emirates',
    ];

    // Determine which countries to display based on selected region
    const countriesToDisplay = selectedRegion === 'Emirates' ? emiratesCountries : gccCountries;


    return (
        <div className="md:col-span-2">
            {/* Region Selection */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Plate<span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-4">
                    <label className="inline-flex items-center">
                        <input
                            type="radio"
                            className="form-radio"
                            name="region"
                            value="Emirates"
                            checked={selectedRegion === 'Emirates'}
                            onChange={handleRegionChange}
                        />
                        <span className="ml-2 text-gray-700">Emirates</span>
                    </label>
                    <label className="inline-flex items-center">
                        <input
                            type="radio"
                            className="form-radio"
                            name="region"
                            value="GCC"
                            checked={selectedRegion === 'GCC'}
                            onChange={handleRegionChange}
                        />
                        <span className="ml-2 text-gray-700">GCC</span>
                    </label>
                </div>
            </div>

            {selectedRegion && (
                <div className='flex gap-2'>
                    {/* Country/State Select */}
                    <div className="mb-4">
                        <select
                            name="country"
                            value={selectedCountry}
                            onChange={handleCountryChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2162AF] focus:border-[#2162AF] transition-colors"
                        >
                            <option value="">Select</option>
                            {countriesToDisplay.map((country) => (
                                <option key={country} value={country}>
                                    {country}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* License Plate Inputs */}
                    <div className="mb-4 inline-block">
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                name="alphabeticPart"
                                placeholder="ABC"
                                value={alphabeticPart}
                                onChange={handleAlphabeticPartChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2162AF] focus:border-[#2162AF] transition-colors"
                                maxLength="3"
                            />
                            <input
                                type="number"
                                name="numericPart"
                                placeholder="12345"
                                value={numericPart}
                                onChange={handleNumericPartChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2162AF] focus:border-[#2162AF] transition-colors"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
