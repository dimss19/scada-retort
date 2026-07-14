import React from 'react';
import { Device, SensorData } from '@/types';
import StatusBadge from './StatusBadge';

interface DeviceCardProps {
    device: Device;
    sensorData?: SensorData;
    onClick?: (device: Device) => void;
}

export default function DeviceCard({ device, sensorData, onClick }: DeviceCardProps) {
    const isClickable = !!onClick;
    
    // Determine effective status: if online but no data for 10s (stale), the parent should pass 'is_online' = false or we calculate it here
    // According to PRD, status stale is when data > 10s. If we don't have sensorData, we rely on device.is_online and last_seen_at.
    
    let status: 'online' | 'offline' | 'stale' = device.is_online ? 'online' : 'offline';
    
    if (device.is_online && device.last_seen_at) {
        const lastSeen = new Date(device.last_seen_at).getTime();
        const now = new Date().getTime();
        if (now - lastSeen > 10000) {
            status = 'stale';
        }
    }

    return (
        <div 
            className={`bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${isClickable ? 'cursor-pointer hover:shadow-md transition-shadow duration-200' : ''}`}
            onClick={() => isClickable && onClick(device)}
            data-testid={`device-card-${device.id}`}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {device.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {device.machine_code}
                    </p>
                </div>
                <StatusBadge status={status} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div>
                    <p className="text-gray-500 dark:text-gray-400">Firmware</p>
                    <p className="font-medium text-gray-900 dark:text-white">{device.firmware_version || 'Unknown'}</p>
                </div>
                {sensorData && (
                    <>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">Temp (PV)</p>
                            <p className="font-medium text-gray-900 dark:text-white">{sensorData.pv !== undefined ? `${sensorData.pv}°C` : '-'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">Phase</p>
                            <p className="font-medium text-gray-900 dark:text-white capitalize">{sensorData.phase || '-'}</p>
                        </div>
                    </>
                )}
                {!sensorData && (
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">Broker</p>
                        <p className="font-medium text-gray-900 dark:text-white">{device.mqtt_broker}:{device.mqtt_port}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
