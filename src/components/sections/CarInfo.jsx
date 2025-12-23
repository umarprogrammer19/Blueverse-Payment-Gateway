import { useEffect, useState } from 'react';

export default function CarInfo({ formData, onChange }) {
    const [selectedRegion, setSelectedRegion] = useState(formData.region || 'Emirates');
    const [selectedCountry, setSelectedCountry] = useState(formData.country || (formData.region === 'Emirates' ? 'Dubai' : ''));
    const [alphabeticPart, setAlphabeticPart] = useState(formData.alphabeticPart || '');
    const [numericPart, setNumericPart] = useState(formData.numericPart || '');

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
            target:
            {
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

    const handleRegionChange = (e) => {
        const value = e.target.value;
        setSelectedRegion(value);
        setSelectedCountry(''); // Reset country when region changes
        setAlphabeticPart('');
        setNumericPart('');
    };

    const handleCountryChange = (e) => {
        setSelectedCountry(e.target.value);
    };

    const handleAlphabeticPartChange = (e) => {
        setAlphabeticPart(e.target.value.toUpperCase());
    };

    const handleNumericPartChange = (e) => {
        setNumericPart(e.target.value);
    };

    const emiratesCountries = [
        'Abu Dhabi',
        'Ajman',
        'Dubai',
        'Fujairah',
        'Ras Al Khaimah',
        'Sharjah',
        'Umm Al Quwain',
    ];

    const gccCountries = [
        'KSA',
        'Bahrain',
        'Kuwait',
        'Oman',
        'Qatar',
        'United Arab Emirates',
    ];

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
                            required
                            aria-required="true"
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
                                required
                                aria-required="true"
                            />
                            <input
                                type="number"
                                name="numericPart"
                                placeholder="12345"
                                value={numericPart}
                                onChange={handleNumericPartChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2162AF] focus:border-[#2162AF] transition-colors"
                                required
                                aria-required="true"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
