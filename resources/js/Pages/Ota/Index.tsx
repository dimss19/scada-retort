import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Device, OtaDeployment } from '@/types';
import OtaUploadForm from '@/Components/OtaUploadForm';
import OtaDeployStatus from '@/Components/OtaDeployStatus';
import DeviceSelector from '@/Components/DeviceSelector';
import PrimaryButton from '@/Components/PrimaryButton';

interface Props {
    devices: Device[];
    deployments: OtaDeployment[];
}

export default function Index({ devices, deployments }: Props) {
    const [selectedDevice, setSelectedDevice] = useState<number | undefined>();
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = (file: File, version: string) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('firmware', file);
        formData.append('version', version);

        router.post(route('ota.upload'), formData, {
            preserveScroll: true,
            onFinish: () => setIsUploading(false),
            onSuccess: () => {
                // handle success
            }
        });
    };

    const handleDeploy = () => {
        if (!selectedDevice) return;
        
        router.post(route('ota.deploy'), {
            device_id: selectedDevice,
            // for simplicity in this skeleton, we'll deploy the latest uploaded firmware
            // normally you'd have a selector for firmware versions too.
        }, {
            preserveScroll: true
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    OTA Firmware Updates
                </h2>
            }
        >
            <Head title="OTA Firmware" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-8">
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <OtaUploadForm 
                                onUpload={handleUpload} 
                                isUploading={isUploading} 
                            />
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Deploy Firmware</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Device</label>
                                    <DeviceSelector 
                                        devices={devices} 
                                        selectedDeviceId={selectedDevice} 
                                        onSelect={setSelectedDevice} 
                                    />
                                </div>
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                                    <PrimaryButton onClick={handleDeploy} disabled={!selectedDevice}>
                                        Deploy to Device
                                    </PrimaryButton>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 px-4 sm:px-0">Recent Deployments</h3>
                        {deployments.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 text-center text-gray-500">
                                No OTA deployments found.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {deployments.map(deployment => (
                                    <OtaDeployStatus key={deployment.id} deployment={deployment} />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
