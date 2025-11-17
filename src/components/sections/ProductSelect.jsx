"use client";


export default function ProductSelect({ value, onChange }) {
    const url = window.location.href;

    return (
        <div>
            <p className="text-md relative left-1 font-medium mb-3 text-gray-900">Select a product</p>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2162AF] focus:border-[#2162AF] outline-none appearance-none bg-white"
            >
                {url.split("/")[3].includes("membership") ? (
                    <option value="Membership">Membership</option>
                ) : (<>
                    <option value="30 Package Wash">30 Package Wash</option>
                    <option value="premium">Manual Wash</option>
                    <option value="business">Express Wash</option>
                </>
                )}
            </select>
        </div>
    );
}
