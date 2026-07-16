import React, { useState } from 'react';

interface Props {
    reading: any;
    onRunStop: (run: boolean) => void;
    onSetSv: (sv: number) => void;
    onAutoTune: () => void;
    onResetAlarm: () => void;
    onSetMode: (manual: boolean) => void;
}

export default function TnControlPanel({ reading, onRunStop, onSetSv, onAutoTune, onResetAlarm, onSetMode }: Props) {
    const [svInput, setSvInput] = useState<string>('');

    if (!reading) return <div className="text-gray-500 text-center py-4">Waiting for data...</div>;

    const handleSvSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (svInput) {
            onSetSv(parseInt(svInput));
            setSvInput('');
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSvSubmit} className="flex items-end space-x-2">
                <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Suhu (SV)</label>
                    <div className="relative rounded-md shadow-sm">
                        <input
                            type="number"
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                            placeholder={reading.sv?.toString() || "0"}
                            value={svInput}
                            onChange={e => setSvInput(e.target.value)}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">℃</span>
                        </div>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={!svInput}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    Set
                </button>
            </form>

            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => onRunStop(true)}
                    disabled={!reading.run_status} // already running (run_status=0 means RUN in TN, but we mapped it to true for RUN) Wait, I mapped 0=RUN to true. 
                    // Actually, mapped: 'run_status' => (bool)($value & (1 << 0)) which is 0=RUN, 1=STOP. So 0=false, 1=true. STOP is true. 
                    // In TnMonitorController: $statusFlags['run_status'] is false if RUN. Let's fix that conceptually. If STOP is true, then !reading.run_status is RUN.
                    className={`inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${!reading.run_status ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                    ▶ RUN
                </button>
                <button
                    onClick={() => onRunStop(false)}
                    disabled={reading.run_status}
                    className={`inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${reading.run_status ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                >
                    ■ STOP
                </button>
                <button
                    onClick={onAutoTune}
                    className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                    🔄 Auto-Tune
                </button>
                <button
                    onClick={onResetAlarm}
                    className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                    🔔 Reset Alarm
                </button>
            </div>
        </div>
    );
}
