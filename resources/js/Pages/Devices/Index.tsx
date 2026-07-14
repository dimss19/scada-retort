import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Device } from '@/types';
import DeviceCard from '@/Components/DeviceCard';
import PrimaryButton from '@/Components/PrimaryButton';

interface Props {
    devices: Device[];
}

export default function Index({ devices }: Props) {
    const handleDeviceClick = (device: Device) => {
        router.visit(route('devices.show', device.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Devices
                    </h2>
                    <PrimaryButton onClick={() => router.visit(route('devices.create'))}>
                        + Add Device
                    </PrimaryButton>
                </div>
            }
        >
            <Head title="Devices" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {devices.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 text-center text-gray-500">
                            No devices found. Create your first device to get started.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {devices.map((device) => (
                                <DeviceCard 
                                    key={device.id} 
                                    device={device} 
                                    onClick={handleDeviceClick}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
