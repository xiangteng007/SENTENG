import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

export const LocationField = ({ label, value, onChange, placeholder }) => {
    const handleOpenInGoogleMaps = () => {
        if (value) {
            const encodedAddress = encodeURIComponent(value);
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <MapPin size={18} />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder || "輸入地址"}
                    className="w-full pl-10 pr-24 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {value && (
                    <button
                        type="button"
                        onClick={handleOpenInGoogleMaps}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md flex items-center gap-1 transition-colors"
                        title="在 Google Maps 中開啟"
                    >
                        <MapPin size={14} />
                        <ExternalLink size={14} />
                    </button>
                )}
            </div>
            {value && (
                <p className="text-xs text-gray-500">
                    點擊右側按鈕可在 Google Maps 中查看此位置
                </p>
            )}
        </div>
    );
};
