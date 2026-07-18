import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { TnController } from '@/types/tn';
import PatternConfig from '@/Components/Tn/PatternConfig';

interface Props extends PageProps {
    controller: TnController;
    configs: Record<number, any>;
    groups: Record<string, any[]>;
}

export default function Config({ auth, controller, configs, groups }: Props) {
    const [activeGroup, setActiveGroup] = useState<string>(Object.keys(groups)[0] || 'operation');
    const [localConfigs, setLocalConfigs] = useState<Record<number, any>>(configs);

    const handleSync = () => {
        router.post(route('tn.config.sync', controller.id), {}, { preserveScroll: true });
    };

    const handleSaveGroup = () => {
        // Collect current group values
        const payload: Record<string, any> = {};
        groups[activeGroup].forEach(param => {
            const val = localConfigs[param.address]?.value;
            if (val !== undefined) payload[param.address] = val;
        });
        
        router.put(route('tn.config.update', [controller.id, activeGroup]), payload, { preserveScroll: true });
    };

    const updateLocalConfig = (address: number, value: number) => {
        setLocalConfigs(prev => ({
            ...prev,
            [address]: { ...prev[address], value }
        }));
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-slate-800 leading-tight">Config: {controller.name}</h2>}
        >
            <Head title={`Config - ${controller.name}`} />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 flex flex-col md:flex-row gap-6">
                    
                    {/* Sidebar Tabs */}
                    <div className="w-full md:w-64 flex-shrink-0">
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700">Parameter Groups</div>
                            <div className="flex flex-col">
                                {Object.keys(groups).map(groupName => (
                                    <button
                                        key={groupName}
                                        onClick={() => setActiveGroup(groupName)}
                                        className={`px-4 py-3 text-left text-sm font-medium transition-colors border-l-4 ${activeGroup === groupName ? 'bg-indigo-50 text-indigo-700 border-indigo-600' : 'text-slate-600 hover:bg-slate-50 border-transparent'}`}
                                    >
                                        {groupName.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                        {activeGroup === 'pattern' ? (
                            <PatternConfig controllerId={controller.id} />
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 uppercase">{activeGroup} Parameters</h3>
                                        <p className="text-sm text-slate-500">Configure parameters for this group. Changes are not applied until saved.</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={handleSync} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg border border-slate-300">
                                            🔄 Sync from Device
                                        </button>
                                        <button onClick={handleSaveGroup} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm">
                                            💾 Save Group
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {groups[activeGroup]?.map((param: any) => {
                                        const currentVal = localConfigs[param.address]?.value ?? param.default;
                                        return (
                                            <div key={param.address} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                                                <div className="w-1/2">
                                                    <div className="font-bold text-slate-700">{param.label}</div>
                                                    <div className="text-xs text-slate-400 font-mono mt-1">Register: {param.address}</div>
                                                </div>
                                                <div className="w-1/2 flex justify-end">
                                                    {param.options ? (
                                                        <select 
                                                            value={currentVal} 
                                                            onChange={e => updateLocalConfig(param.address, parseInt(e.target.value))}
                                                            className="rounded border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 min-w-[200px]"
                                                        >
                                                            {Object.entries(param.options).map(([val, label]) => (
                                                                <option key={val} value={val}>{String(label)}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <input 
                                                            type="number" 
                                                            value={currentVal}
                                                            min={param.min}
                                                            max={param.max}
                                                            onChange={e => updateLocalConfig(param.address, parseInt(e.target.value))}
                                                            className="rounded border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-right w-32"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
