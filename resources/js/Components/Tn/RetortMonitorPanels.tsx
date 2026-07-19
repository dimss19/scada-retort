import React from 'react';
import { ScadaCanvas as ScadaCanvasType, ScadaMapping, SensorData } from '@/types';
import { RetortEvent, RetortTelemetry } from '@/Pages/Tn/retortTelemetry';
import TnTrendChart from './TnTrendChart';
import ScadaCanvasView from '@/Components/ScadaCanvas';

interface Props {
    telemetry: RetortTelemetry;
    events: RetortEvent[];
    history: any[];
    mappings: ScadaMapping[];
    canvas?: ScadaCanvasType | null;
    sensorData?: SensorData;
    isOnline: boolean;
    eventToneClasses: Record<RetortEvent['tone'], string>;
}

export default function RetortMonitorPanels({
    telemetry,
    events,
    history,
    mappings,
    canvas,
    sensorData,
    isOnline,
    eventToneClasses,
}: Props) {
    return (
        <>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="font-bold text-slate-800">Trend Temperatur</h2>
                            <p className="text-xs text-slate-500">PV dan SV dalam engineering unit, maksimum 30 menit.</p>
                        </div>
                        <div className="flex gap-4 text-xs font-semibold">
                            <span className="text-blue-600">PV {telemetry.actualTemperature?.toLocaleString('id-ID') ?? '--'} °C</span>
                            <span className="text-emerald-600">SV {telemetry.targetTemperature?.toLocaleString('id-ID') ?? '--'} °C</span>
                        </div>
                    </div>
                    <div className="h-72 w-full">
                        <TnTrendChart data={isOnline ? history : []} />
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="font-bold text-slate-800">Event Proses</h2>
                            <p className="text-xs text-slate-500">Diturunkan dari perubahan reading TN terbaru.</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{events.length}</span>
                    </div>
                    <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
                        {events.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">
                                Belum ada perubahan status pada rentang data ini.
                            </div>
                        ) : events.map((event) => (
                            <div key={event.id} className="flex gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${eventToneClasses[event.tone]}`} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-slate-700">{event.label}</p>
                                    <p className="text-[10px] text-slate-400">
                                        {event.timestamp ? new Date(event.timestamp).toLocaleString('id-ID') : '--'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <section className={`rounded-2xl border p-5 shadow-sm ${telemetry.alarmActive ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className={`font-bold ${telemetry.alarmActive ? 'text-red-800' : 'text-emerald-800'}`}>Alarm Controller</h2>
                            <p className={`mt-1 text-sm ${telemetry.alarmActive ? 'text-red-700' : 'text-emerald-700'}`}>
                                {telemetry.alarmActive
                                    ? [telemetry.sensorFault, ...telemetry.activeAlarms].filter(Boolean).join(' • ')
                                    : 'Tidak ada alarm TN yang aktif.'}
                            </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${telemetry.alarmActive ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                            {telemetry.alarmActive ? 'ACTIVE' : 'NORMAL'}
                        </span>
                    </div>
                    <p className="mt-4 text-xs text-slate-500">
                        AL1–AL7 mengikuti konfigurasi alarm controller TN. Nama alarm fisik seperti gas, pressure, door, dan cooling belum diasumsikan sebelum I/O dipetakan.
                    </p>
                </section>

                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                    <h2 className="font-bold text-amber-900">Cakupan I/O Saat Ini</h2>
                    <p className="mt-1 text-sm leading-6 text-amber-800">
                        Realtime tersedia untuk temperatur, target, output heating/cooling, RUN/STOP, mode, step, waktu, dan alarm TN. Pressure boiler, water level, gas, pilot, steam valve, door lock, compressor, serta drain ditampilkan sebagai belum dipetakan agar operator tidak menerima status palsu.
                    </p>
                </section>
            </div>

            {mappings.length > 0 ? (
                <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
                        <div>
                            <h2 className="font-bold text-slate-800">Canvas Engineering Terkonfigurasi</h2>
                            <p className="text-xs text-slate-500">{mappings.length} elemen dari SCADA Editor.</p>
                        </div>
                        <span className="text-sm font-bold text-cyan-700 group-open:rotate-180">⌄</span>
                    </summary>
                    <div className="border-t border-slate-200 p-4">
                        <ScadaCanvasView
                            mappings={mappings}
                            canvas={canvas}
                            sensorData={sensorData}
                            readonly
                            className="min-h-[500px]"
                        />
                    </div>
                </details>
            ) : null}
        </>
    );
}
