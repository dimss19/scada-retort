import React from 'react';
import { Link, useForm } from '@inertiajs/react';
import { TnController } from '@/types/tn';

export default function TnCard({ controller }: { controller: any }) {
    const latestReading = controller.readings && controller.readings.length > 0 ? controller.readings[0] : null;

    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-200">
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{controller.name}</h3>
                        <p className="text-sm text-gray-500">Slave ID: {controller.slave_id} &bull; Model: {controller.model_type}</p>
                    </div>
                    <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${controller.is_online ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {controller.is_online ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-3 rounded-md text-center border border-gray-100">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">PV</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {latestReading ? latestReading.pv : '--'} <span className="text-sm font-normal text-gray-500">℃</span>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md text-center border border-gray-100">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">SV</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {latestReading ? latestReading.sv : '--'} <span className="text-sm font-normal text-gray-500">℃</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-2">
                    <Link
                        href={route('tn.monitor', controller.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Monitor
                    </Link>
                    <Link
                        href={route('tn.config.edit', controller.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Config
                    </Link>
                </div>
            </div>
        </div>
    );
}
