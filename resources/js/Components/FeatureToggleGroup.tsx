import React, { useState } from 'react';
import { ModuleName, FeatureConfig } from '@/types';
import PrimaryButton from './PrimaryButton';

interface FeatureToggleGroupProps {
    initialFeatures: Partial<FeatureConfig>[];
    onSave: (features: { module_name: ModuleName; enabled: boolean }[]) => void;
    isSaving?: boolean;
}

export default function FeatureToggleGroup({ initialFeatures, onSave, isSaving = false }: FeatureToggleGroupProps) {
    const allModules = Object.values(ModuleName);
    
    // Initialize state with all modules, defaulting to false if not provided in initialFeatures
    const [features, setFeatures] = useState<{ module_name: ModuleName; enabled: boolean }[]>(
        allModules.map(moduleName => {
            const existing = initialFeatures.find(f => f.module_name === moduleName);
            return {
                module_name: moduleName,
                enabled: existing ? !!existing.enabled : false
            };
        })
    );

    const handleToggle = (moduleName: ModuleName) => {
        setFeatures(features.map(f => 
            f.module_name === moduleName ? { ...f, enabled: !f.enabled } : f
        ));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(features);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="feature-toggle-group">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Module Features</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {features.map((feature) => (
                        <div key={feature.module_name} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                                    {feature.module_name.replace('_', ' ')}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle(feature.module_name)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                    feature.enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                                role="switch"
                                aria-checked={feature.enabled}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        feature.enabled ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <PrimaryButton type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Features'}
                </PrimaryButton>
            </div>
        </form>
    );
}
