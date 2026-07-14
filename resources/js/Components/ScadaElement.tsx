import React from 'react';
import { ScadaMapping, SensorData } from '@/types';

interface ScadaElementProps {
    mapping: ScadaMapping;
    sensorData?: SensorData;
    className?: string;
}

export default function ScadaElement({ mapping, sensorData, className = '' }: ScadaElementProps) {
    const value = sensorData && mapping.data_source in sensorData 
        ? sensorData[mapping.data_source] 
        : null;

    const getStatusColor = () => {
        if (value === null || typeof value !== 'number') return mapping.normal_color;
        
        if (mapping.critical_threshold !== null && value >= mapping.critical_threshold) {
            return mapping.critical_color;
        }
        if (mapping.warning_threshold !== null && value >= mapping.warning_threshold) {
            return mapping.warning_color;
        }
        return mapping.normal_color;
    };

    const color = getStatusColor();

    return (
        <div 
            className={`absolute flex flex-col items-center justify-center p-2 rounded shadow-sm border ${className}`}
            style={{ 
                backgroundColor: `${color}20`, // 20% opacity for background
                borderColor: color,
                // In a real canvas, top/left would be driven by mapping properties.
                // For this component, we just handle the visual representation of the element.
            }}
            data-testid={`scada-element-${mapping.element_id}`}
        >
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                {mapping.element_id}
            </span>
            <div className="text-lg font-bold" style={{ color }}>
                {value !== null ? (
                    typeof value === 'number' ? value.toFixed(1) : String(value)
                ) : (
                    <span className="text-gray-400">--</span>
                )}
            </div>
            <span className="text-[10px] text-gray-500 mt-0.5">
                {mapping.data_source}
            </span>
        </div>
    );
}
