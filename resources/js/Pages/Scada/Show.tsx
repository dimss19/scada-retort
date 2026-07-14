import React, { useEffect, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Device, ScadaMapping, SensorData, FeatureConfig } from '@/types';
import ScadaCanvas from '@/Components/ScadaCanvas';

interface Props {
    device: Device;
    mappings: ScadaMapping[];
    featureConfigs: FeatureConfig[];
}

export default function Show({ device, mappings, featureConfigs }: Props) {
    const [sensorData, setSensorData] = useState<SensorData | undefined>();
    const [isConnected, setIsConnected] = useState(false);

    // Rule 5: Modul dinonaktifkan → sembunyikan elemen SCADA
    const activeMappings = mappings.filter(m => {
        if (!m.module_dependency) return true; // not dependent on any module
        const module = featureConfigs.find(f => f.module_name === m.module_dependency);
        return module ? module.enabled : false;
    });

    useEffect(() => {
        // Assume window.Echo is available via resources/js/echo.js setup
        if (window.Echo) {
            const channelName = `retort.${device.machine_code}`;
            const channel = window.Echo.private(channelName);

            channel.listen('SensorDataReceived', (e: any) => {
                setSensorData(e.data);
                setIsConnected(true);
            });

            // Handle connection status if supported by Echo/Pusher
            channel.subscribed(() => {
                setIsConnected(true);
            });

            channel.error(() => {
                setIsConnected(false);
            });

            return () => {
                window.Echo?.leave(channelName);
            };
        }
    }, [device.machine_code]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200 flex items-center">
                        SCADA View: {device.name}
                        <span className={`ml-3 w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} title={isConnected ? 'Connected to WebSocket' : 'Disconnected'}></span>
                    </h2>
                </div>
            }
        >
            <Head title={`SCADA - ${device.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            {/* In a real scenario, backgroundImageUrl would come from device settings or be hardcoded for the machine type */}
                            <ScadaCanvas 
                                mappings={activeMappings} 
                                sensorData={sensorData}
                                className="min-h-[600px]"
                            />
                        </div>
                    </div>
                    
                    {sensorData && (
                        <div className="mt-6 bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Raw Data Feed</h3>
                            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-xs text-gray-800 dark:text-gray-300 overflow-x-auto">
                                {JSON.stringify(sensorData, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
