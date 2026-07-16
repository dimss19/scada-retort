import React from 'react';

interface Props {
    value?: number;
    label: string;
    unit: string;
    color: string;
    max: number;
}

export default function TnGauge({ value, label, unit, color, max }: Props) {
    const isError = value === 31000 || value === 30000 || value === -30000;
    let displayValue = value;
    let displayText = value?.toString();

    if (value === 31000) displayText = 'OPEN';
    else if (value === 30000) displayText = 'HHHH';
    else if (value === -30000) displayText = 'LLLL';

    // Simple textual representation instead of a complex canvas gauge for now
    // A premium design could use a real donut chart or gauge library here
    return (
        <div className="relative w-48 h-48 rounded-full border-8 border-gray-100 flex items-center justify-center shadow-inner">
            <div 
                className="absolute inset-0 rounded-full border-8"
                style={{ 
                    borderColor: isError ? '#ef4444' : color, 
                    borderTopColor: 'transparent',
                    borderRightColor: 'transparent',
                    transform: 'rotate(135deg)',
                    clipPath: value !== undefined && !isError ? `polygon(0 0, 100% 0, 100% ${Math.min(100, (value / max) * 100)}%, 0 100%)` : 'none'
                }}
            />
            <div className="text-center z-10">
                <div className={`text-4xl font-black ${isError ? 'text-red-500' : 'text-gray-800'}`}>
                    {value === undefined ? '--' : displayText}
                </div>
                <div className="text-sm font-semibold text-gray-500 mt-1">{unit}</div>
            </div>
        </div>
    );
}
