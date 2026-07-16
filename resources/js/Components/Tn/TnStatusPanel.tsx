import React from 'react';

interface Props {
    reading: any;
    modelType: string;
}

export default function TnStatusPanel({ reading, modelType }: Props) {
    if (!reading) return <div className="text-gray-500 text-center py-4">Waiting for data...</div>;

    const alarmCount = modelType === 'TNS' ? 2 : (modelType === 'TNH' ? 4 : 6);
    
    return (
        <div className="space-y-6">
            <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Outputs & Modes</h4>
                <div className="flex flex-wrap gap-3">
                    <span className={`px-3 py-1.5 rounded text-sm font-bold border ${reading.out1_active ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                        OUT1 {reading.out1_active ? '● ON' : '○ OFF'}
                    </span>
                    <span className={`px-3 py-1.5 rounded text-sm font-bold border ${reading.out2_active ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                        OUT2 {reading.out2_active ? '● ON' : '○ OFF'}
                    </span>
                    <span className={`px-3 py-1.5 rounded text-sm font-bold border ${reading.at_running ? 'bg-purple-100 text-purple-800 border-purple-200 animate-pulse' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                        AT {reading.at_running ? '● RUN' : '○ OFF'}
                    </span>
                    <span className={`px-3 py-1.5 rounded text-sm font-bold border ${reading.auto_manual ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-green-100 text-green-800 border-green-200'}`}>
                        {reading.auto_manual ? 'MANUAL' : 'AUTO'}
                    </span>
                </div>
            </div>

            <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Alarms</h4>
                <div className="flex flex-wrap gap-2">
                    {Array.from({ length: alarmCount }).map((_, i) => {
                        const alKey = `al${i + 1}`;
                        const isAlarm = reading.alarms && reading.alarms[alKey];
                        return (
                            <div key={i} className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${isAlarm ? 'border-red-500 bg-red-100 text-red-700 animate-pulse' : 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                                <span className="text-xs font-bold">AL{i + 1}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {reading.pv === 31000 || reading.pv === 30000 || reading.pv === -30000 ? (
                <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-700">
                    <div className="font-bold">Sensor Error Detected!</div>
                    <p className="text-sm">
                        {reading.pv === 31000 && "OPEN: Sensor is disconnected or broken."}
                        {reading.pv === 30000 && "HHHH: Temperature exceeds upper limit."}
                        {reading.pv === -30000 && "LLLL: Temperature is below lower limit."}
                    </p>
                </div>
            ) : null}
        </div>
    );
}
