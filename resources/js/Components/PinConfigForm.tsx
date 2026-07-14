import React, { useState } from 'react';
import { PinConfig, PinFunction } from '@/types';
import PrimaryButton from './PrimaryButton';

interface PinConfigFormProps {
    initialConfigs: Partial<PinConfig>[];
    onSave: (configs: { function: PinFunction; gpio_pin: number }[]) => void;
    isSaving?: boolean;
}

export default function PinConfigForm({ initialConfigs, onSave, isSaving = false }: PinConfigFormProps) {
    const [configs, setConfigs] = useState<Partial<PinConfig>[]>(
        initialConfigs.length > 0 ? initialConfigs : [{ function: PinFunction.RS485_RX, gpio_pin: 0 }]
    );

    const availableFunctions = Object.values(PinFunction);

    const handleAddRow = () => {
        setConfigs([...configs, { function: availableFunctions[0], gpio_pin: 0 }]);
    };

    const handleRemoveRow = (index: number) => {
        setConfigs(configs.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: keyof PinConfig, value: any) => {
        const newConfigs = [...configs];
        newConfigs[index] = { ...newConfigs[index], [field]: value };
        setConfigs(newConfigs);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(configs as { function: PinFunction; gpio_pin: number }[]);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="pin-config-form">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Pin Configuration</h3>
                
                {configs.map((config, index) => (
                    <div key={index} className="flex items-center space-x-4 mb-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Function</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={config.function}
                                onChange={(e) => handleChange(index, 'function', e.target.value)}
                                required
                            >
                                {availableFunctions.map((fn) => (
                                    <option key={fn} value={fn}>{fn}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">GPIO Pin</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={config.gpio_pin ?? 0}
                                onChange={(e) => handleChange(index, 'gpio_pin', parseInt(e.target.value))}
                                required
                            />
                        </div>
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={() => handleRemoveRow(index)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                disabled={configs.length === 1}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={handleAddRow}
                    className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    + Add Pin
                </button>
            </div>

            <div className="flex justify-end">
                <PrimaryButton type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                </PrimaryButton>
            </div>
        </form>
    );
}
