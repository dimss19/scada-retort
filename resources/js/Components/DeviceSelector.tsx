import React from 'react';
import { Device } from '@/types';

interface DeviceSelectorProps {
    devices: Device[];
    selectedDeviceId?: number;
    onSelect: (deviceId: number) => void;
    className?: string;
}

export default function DeviceSelector({ devices, selectedDeviceId, onSelect, className = '' }: DeviceSelectorProps) {
    return (
        <div className={`relative ${className}`}>
            <select
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={selectedDeviceId || ''}
                onChange={(e) => onSelect(Number(e.target.value))}
                data-testid="device-selector"
            >
                <option value="" disabled>Select a device</option>
                {devices.map((device) => (
                    <option key={device.id} value={device.id}>
                        {device.name} ({device.machine_code})
                    </option>
                ))}
            </select>
        </div>
    );
}
