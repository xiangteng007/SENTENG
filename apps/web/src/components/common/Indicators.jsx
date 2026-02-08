
// Indicator components

export const LoadingSkeleton = ({ rows = 3 }) => (
    <div className="animate-pulse space-y-4">
        {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex gap-4">
                <div className="h-12 w-12 bg-gray-100 rounded-full"></div>
                <div className="flex-1 space-y-2.5 py-1">
                    <div className="h-3.5 bg-gray-100 rounded-lg w-2/5"></div>
                    <div className="h-3 bg-gray-100 rounded-lg w-3/5"></div>
                </div>
            </div>
        ))}
    </div>
);

export const ProgressBar = ({ value, label, color = "gray", size = "default" }) => {
    const colors = {
        gray: "from-zinc-600 to-zinc-500",
        blue: "from-blue-500 to-blue-600",
        green: "from-green-500 to-green-600",
        orange: "from-orange-400 to-amber-500",
        red: "from-red-500 to-rose-500",
        purple: "from-zinc-600 to-zinc-700",
        gold: "from-[#D4AF37] to-[#B8960C]"
    };

    const sizes = {
        sm: "h-1.5",
        default: "h-2",
        lg: "h-2.5"
    };

    return (
        <div className="w-full">
            {label && (
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-500">{label}</span>
                    <span className="text-xs font-semibold text-gray-700">{value}%</span>
                </div>
            )}
            <div className={`w-full bg-gray-100 rounded-full ${sizes[size]} overflow-hidden`}>
                <div
                    className={`${sizes[size]} bg-gradient-to-r ${colors[color] || colors.gray} rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                />
            </div>
        </div>
    );
};

export const SectionTitle = ({ title, subtitle, action }) => (
    <div className="flex items-end justify-between mb-1">
        <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
    </div>
);
