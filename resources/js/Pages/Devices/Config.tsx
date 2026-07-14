import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Device, PinConfig, FeatureConfig } from '@/types';
import PinConfigForm from '@/Components/PinConfigForm';
import FeatureToggleGroup from '@/Components/FeatureToggleGroup';

interface Props {
    device: Device;
    pinConfigs: PinConfig[];
    featureConfigs: FeatureConfig[];
    isRunning: boolean;
}

export default function Config({ device, pinConfigs, featureConfigs, isRunning }: Props) {
    const handleSavePins = (configs: any) => {
        if (isRunning) return;
        router.put(route('config.updatePins', device.id), { configs }, {
            preserveScroll: true,
            onSuccess: () => {
                // Handle success, e.g., show a toast
            }
        });
    };

    const handleSaveFeatures = (features: any) => {
        if (isRunning) return;
        router.put(route('config.updateFeatures', device.id), { features }, {
            preserveScroll: true,
            onSuccess: () => {
                // Handle success
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Configuration: {device.name}
                    </h2>
                    {isRunning && (
                        <span className="text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                            Device is running. Configuration locked.
                        </span>
                    )}
                </div>
            }
        >
            <Head title={`Config - ${device.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-8">
                    <section className={isRunning ? 'opacity-60 pointer-events-none' : ''}>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 px-4 sm:px-0">Pin Configuration</h3>
                        <PinConfigForm 
                            initialConfigs={pinConfigs} 
                            onSave={handleSavePins} 
                        />
                    </section>

                    <section className={isRunning ? 'opacity-60 pointer-events-none' : ''}>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 px-4 sm:px-0">Feature Modules</h3>
                        <FeatureToggleGroup 
                            initialFeatures={featureConfigs} 
                            onSave={handleSaveFeatures} 
                        />
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
