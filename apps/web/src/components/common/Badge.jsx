import React from 'react';

const colorStyles = {
    gray: "bg-zinc-100 text-zinc-600 border-zinc-200/50",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    purple: "bg-zinc-100 text-zinc-700 border-zinc-200",
    red: "bg-red-50 text-red-600 border-red-100",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-100",
    indigo: "bg-zinc-100 text-zinc-700 border-zinc-200",
    gold: "bg-[#D4AF37]/15 text-[#B8960C] border-[#D4AF37]/30",
    pink: "bg-pink-50 text-pink-600 border-pink-100",
    teal: "bg-teal-50 text-teal-600 border-teal-100",
    // Solid variants
    'solid-gray': "bg-zinc-800 text-white border-transparent",
    'solid-green': "bg-green-600 text-white border-transparent",
    'solid-blue': "bg-blue-500 text-white border-transparent",
    'solid-red': "bg-red-500 text-white border-transparent",
    'solid-gold': "bg-[#D4AF37] text-zinc-900 border-transparent",
};

const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    default: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm"
};

export const Badge = ({
    children,
    color = "gray",
    className = "",
    size = "default",
    dot = false
}) => {
    return (
        <span className={`
            inline-flex items-center gap-1.5
            rounded-full font-medium border
            transition-colors duration-200
            ${colorStyles[color] || colorStyles.gray} 
            ${sizeStyles[size] || sizeStyles.default}
            ${className}
        `}>
            {dot && (
                <span className={`
                    w-1.5 h-1.5 rounded-full 
                    ${color.includes('solid') ? 'bg-white/80' : 'bg-current opacity-70'}
                `} />
            )}
            {children}
        </span>
    );
};
