import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Device } from '@/types';
import DeviceCard from '@/Components/DeviceCard';

interface Props {
    device: Device;
}

export default function Show({ device }: Props) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Device Details: {device.name}
                    </h2>
                    <div className="space-x-3">
                        <Link 
                            href={route('config.edit', device.id)}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition duration-150 ease-in-out hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Configuration
                        </Link>
                        <Link 
                            href={route('scada.show', device.id)}
                            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-indigo-700"
                        >
                            SCADA View
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Device - ${device.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <DeviceCard device={device} />
                    
                    <div className="mt-6 bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Device Information</h3>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Machine Code</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">{device.machine_code}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">MQTT Broker</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{device.mqtt_broker}:{device.mqtt_port}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{new Date(device.created_at).toLocaleString()}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Seen</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : 'Never'}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
