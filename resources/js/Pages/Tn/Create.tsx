import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import axios from 'axios';

export default function Create({ auth }: PageProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slave_id: 1,
        model_type: 'TNH',
        control_model: 'fixed',
        serial_port: 'COM3',
        baudrate: 9600,
        parity: 'N',
        stopbits: 2,
    });

    const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('tn.store'));
    };

    // The test connection endpoint would be tricky to call before the model is created,
    // so we might just create it and test it later, or pass the full config to a generic test endpoint.
    // For now, let's keep the UI simple.

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Register TN Controller</h2>}
        >
            <Head title="Add TN Controller" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <form onSubmit={submit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Controller Name</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        required
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Slave ID (1-99)</label>
                                    <input
                                        type="number"
                                        min="1" max="99"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                        value={data.slave_id}
                                        onChange={e => setData('slave_id', parseInt(e.target.value))}
                                        required
                                    />
                                    {errors.slave_id && <p className="text-red-500 text-xs mt-1">{errors.slave_id}</p>}
                                </div>

                                <fieldset>
                                    <legend className="text-sm font-medium text-gray-700 mb-2">Model Type (REQUIRED)</legend>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { id: 'TNS', name: 'TNS', desc: '48×48mm Compact', info: '2 Alarms, No CT Input' },
                                            { id: 'TNH', name: 'TNH', desc: '48×96mm Standard', info: '4 Alarms, 1 CT Input, 3rd Display' },
                                            { id: 'TNL', name: 'TNL', desc: '96×96mm Large', info: '6 Alarms, 2 CT Inputs, 3rd Display' }
                                        ].map((model) => (
                                            <label key={model.id} className={`cursor-pointer border rounded-lg p-4 flex flex-col ${data.model_type === model.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                                                <div className="flex items-center mb-2">
                                                    <input
                                                        type="radio"
                                                        name="model_type"
                                                        value={model.id}
                                                        checked={data.model_type === model.id}
                                                        onChange={e => setData('model_type', e.target.value as 'TNS'|'TNH'|'TNL')}
                                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                    />
                                                    <span className="ml-2 block text-sm font-medium text-gray-900">{model.name}</span>
                                                </div>
                                                <span className="block text-sm text-gray-500 ml-6">{model.desc}</span>
                                                <span className="block text-xs text-gray-400 ml-6 mt-1">{model.info}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {errors.model_type && <p className="text-red-500 text-xs mt-1">{errors.model_type}</p>}
                                </fieldset>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Control Model</label>
                                    <div className="flex items-center space-x-4">
                                        <label className="flex items-center">
                                            <input type="radio" value="fixed" checked={data.control_model === 'fixed'} onChange={e => setData('control_model', 'fixed')} className="h-4 w-4 text-indigo-600" />
                                            <span className="ml-2">Fixed</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input type="radio" value="program" checked={data.control_model === 'program'} onChange={e => setData('control_model', 'program')} className="h-4 w-4 text-indigo-600" />
                                            <span className="ml-2">Program (Pattern)</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-6">
                                    <h4 className="text-sm font-medium text-gray-900 mb-4">Serial Communication</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-500">Port (leave default for env setting)</label>
                                            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" value={data.serial_port} onChange={e => setData('serial_port', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500">Baudrate</label>
                                            <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" value={data.baudrate} onChange={e => setData('baudrate', parseInt(e.target.value))}>
                                                <option value="9600">9600</option>
                                                <option value="19200">19200</option>
                                                <option value="38400">38400</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring ring-gray-300 disabled:opacity-25 transition ease-in-out duration-150"
                                    >
                                        Save Controller
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
