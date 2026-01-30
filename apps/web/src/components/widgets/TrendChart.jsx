
import React from 'react';

export const TrendChart = ({ color = "#7C90A0" }) => {
    const values = [40, 35, 60, 50, 80, 75, 90];
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const points = values.map((v, i) => `${(i / (values.length - 1)) * 100},${100 - ((v - min) / range) * 80}`).join(' ');

    return (
        <div className="w-full h-full relative flex items-end pb-2">
            <svg className="w-full h-24 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={`M0,100 ${points.split(' ').map(p => `L${p}`).join(' ')} L100,100 Z`} fill="url(#gradient)" />
                <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                <circle cx="100" cy={100 - ((values[values.length - 1] - min) / range) * 80} r="4" fill={color} />
            </svg>
        </div>
    );
};
