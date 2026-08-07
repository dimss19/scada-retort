import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
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
        const payload: Record<string, any> = {};
        groups[activeGroup]?.forEach(param => {
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
            header={
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between max-w-7xl mx-auto">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">Konfigurasi Controller</h1>
                        <p className="text-sm font-semibold text-slate-600">
                            {(controller as any).machine?.machine_name ? `${(controller as any).machine.machine_name} • ` : ''}
                            {controller.name || `Controller #${controller.id}`} • <span className="font-mono text-blue-700 font-bold">{controller.model_type}</span>
                        </p>
                    </div>
                    <Link href={route('tn.show', controller.id)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                        ← Kembali ke Monitor
                    </Link>
                </div>
            }
        >
            <Head title={`Konfigurasi - ${controller.name}`} />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-6">
                    
                    {/* Sidebar Tabs */}
                    <div className="w-full md:w-64 flex-shrink-0">
                        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-3 backdrop-blur-xl">
                            <div className="px-4 py-3 text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50/80 rounded-2xl mb-2">
                                Parameter Groups
                            </div>
                            <div className="flex flex-col gap-1.5">
                                {Object.keys(groups).map(groupName => (
                                    <button
                                        key={groupName}
                                        onClick={() => setActiveGroup(groupName)}
                                        className={`px-4 py-3 text-left text-xs font-black uppercase tracking-wider transition-all duration-200 rounded-xl ${
                                            activeGroup === groupName
                                                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md'
                                                : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                                        }`}
                                    >
                                        {groupName}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-white rounded-3xl border border-slate-200/90 shadow-lg p-7 backdrop-blur-xl">
                        {activeGroup === 'pattern' ? (
                            <PatternConfig controllerId={controller.id} />
                        ) : (
                            <>
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 pb-5 border-b border-slate-200">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 uppercase">{activeGroup} Parameters</h3>
                                        <p className="text-xs font-semibold text-slate-500 mt-0.5">Atur parameter Modbus untuk grup ini. Perubahan akan disimpan saat tombol Simpan diklik.</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={handleSync} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xl border border-slate-300 shadow-sm transition-all">
                                            Sync from Device
                                        </button>
                                        <button onClick={handleSaveGroup} className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all border-none">
                                            Save Group
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3.5">
                                    {groups[activeGroup]?.map((param: any) => {
                                        const currentVal = localConfigs[param.address]?.value ?? param.default;
                                        return (
                                            <div key={param.address} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:bg-blue-50/40 transition-colors gap-3">
                                                <div className="sm:w-1/2">
                                                    <div className="font-extrabold text-slate-800 text-sm">{param.label}</div>
                                                    <div className="inline-block text-[11px] text-blue-700 font-mono font-bold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md mt-1">Register: {param.address}</div>
                                                </div>
                                                <div className="sm:w-1/2 flex sm:justify-end">
                                                    {param.options ? (
                                                        <select 
                                                            value={currentVal} 
                                                            onChange={e => updateLocalConfig(param.address, parseInt(e.target.value))}
                                                            className="rounded-xl border-slate-300 bg-white shadow-sm focus:border-blue-600 focus:ring-blue-600 text-sm font-bold text-slate-900 min-w-[200px] py-2 px-3"
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
                                                            className="rounded-xl border-slate-300 bg-white shadow-sm focus:border-blue-600 focus:ring-blue-600 text-sm font-mono font-bold text-slate-900 text-right w-36 py-2 px-3"
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
