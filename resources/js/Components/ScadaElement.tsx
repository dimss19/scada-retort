import React from 'react';
import { ScadaMapping, SensorData } from '@/types';

interface ScadaElementProps {
    mapping: ScadaMapping;
    sensorData?: SensorData;
    className?: string;
    selected?: boolean;
    onSelect?: (id: number) => void;
}

type ScadaValue = number | string | boolean | null;

const ERROR_VALUES: Record<number, string> = {
    31000: 'OPEN',
    30000: 'HHHH',
    [-30000]: 'LLLL',
};

const PERCENT_SOURCES = new Set(['heating_mv', 'cooling_mv']);
const TIME_SOURCES = new Set(['process_time', 'rest_time']);
const INTEGER_SOURCES = new Set(['pattern_current', 'step_current']);

function isErrorValue(value: number): boolean {
    return Object.prototype.hasOwnProperty.call(ERROR_VALUES, value);
}

function getSensorValue(mapping: ScadaMapping, sensorData?: SensorData): ScadaValue {
    if (!sensorData) return null;
    const rawValue = sensorData[mapping.data_source];
    if (rawValue === undefined || rawValue === null) return null;
    if (!['number', 'string', 'boolean'].includes(typeof rawValue)) return null;

    if (typeof rawValue !== 'number' || isErrorValue(rawValue)) return rawValue;

    if (mapping.data_source === 'pv' || mapping.data_source === 'sv') {
        const decimalPoint = Number(sensorData.decimal_point);
        if (Number.isInteger(decimalPoint) && decimalPoint >= 0 && decimalPoint <= 6) {
            return rawValue / Math.pow(10, decimalPoint);
        }
    }

    if (PERCENT_SOURCES.has(mapping.data_source)) return rawValue / 10;
    return rawValue;
}

function getStatusColor(mapping: ScadaMapping, value: ScadaValue): string {
    if (value === null || typeof value !== 'number') return mapping.normal_color;
    if (mapping.critical_threshold !== null && value >= mapping.critical_threshold) return mapping.critical_color;
    if (mapping.warning_threshold !== null && value >= mapping.warning_threshold) return mapping.warning_color;
    return mapping.normal_color;
}

function formatBoolean(source: string, value: boolean): string {
    if (source === 'run_status') return value ? 'STOP' : 'RUN';
    if (source === 'auto_manual') return value ? 'MANUAL' : 'AUTO';
    if (source === 'at_running') return value ? 'RUNNING' : 'OFF';
    return value ? 'ON' : 'OFF';
}

function formatTnTime(value: number): string {
    const digits = String(Math.max(0, Math.trunc(value))).padStart(4, '0');
    return `${digits.slice(0, -2)}:${digits.slice(-2)}`;
}

function formatValue(mapping: ScadaMapping, value: ScadaValue, dp: number = 1): string {
    if (value === null) return '--';
    if (typeof value === 'boolean') return formatBoolean(mapping.data_source, value);
    if (typeof value === 'string') return value;
    if (isErrorValue(value)) return ERROR_VALUES[value];
    if (TIME_SOURCES.has(mapping.data_source)) return formatTnTime(value);
    if (INTEGER_SOURCES.has(mapping.data_source)) return Math.trunc(value).toString();
    return value.toFixed(dp);
}

function isSourceActive(mapping: ScadaMapping, value: ScadaValue): boolean {
    if (value === null) return false;
    if (typeof value === 'boolean') return mapping.data_source === 'run_status' ? !value : value;
    if (typeof value === 'number') {
        if (isErrorValue(value)) return false;
        return mapping.data_source === 'run_status' ? value === 0 : value > 0;
    }

    const normalized = value.trim().toLowerCase();
    return ['on', 'open', 'run', 'running', 'active', 'true', '1'].includes(normalized);
}

function getGaugeDefinition(source: string): { min: number; max: number; unit: string } {
    if (source === 'pv' || source === 'sv') return { min: 0, max: 200, unit: '°C' };
    if (PERCENT_SOURCES.has(source)) return { min: 0, max: 100, unit: '%' };
    return { min: 0, max: 100, unit: '' };
}

function GaugeElement({ mapping, sensorData }: { mapping: ScadaMapping; sensorData?: SensorData }) {
    const value = getSensorValue(mapping, sensorData);
    const color = getStatusColor(mapping, value);
    const { min, max, unit } = getGaugeDefinition(mapping.data_source);
    const numVal = typeof value === 'number' ? value : 0;
    const pct = Math.min(100, Math.max(0, ((numVal - min) / (max - min)) * 100));

    return (
        <div className="flex h-full w-full flex-col items-center justify-center rounded-md bg-slate-900/90">
            <svg viewBox="0 0 120 120" className="h-full max-h-full w-full" role="img" aria-label={mapping.label || mapping.element_id}>
                <circle cx="60" cy="60" r="55" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#1e293b" strokeWidth="8" />
                <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="8"
                    strokeDasharray={`${(pct / 100) * 314} 314`}
                    transform="rotate(-90 60 60)" strokeLinecap="round" />
                <text x="60" y="55" textAnchor="middle" className="text-lg font-bold" fill={color} fontSize="16">
                    {formatValue(mapping, value)}
                </text>
                <text x="60" y="75" textAnchor="middle" fill="#94a3b8" fontSize="10">{unit || mapping.data_source}</text>
            </svg>
            {mapping.label && <span className="mt-0.5 max-w-full truncate px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300">{mapping.label}</span>}
        </div>
    );
}

function DisplayElement({ mapping, sensorData }: { mapping: ScadaMapping; sensorData?: SensorData }) {
    const value = getSensorValue(mapping, sensorData);
    const color = getStatusColor(mapping, value);

    return (
        <div className="flex h-full w-full flex-col items-center justify-center rounded-md border bg-slate-900/95 shadow-inner" style={{
            borderColor: color,
            boxShadow: `inset 0 0 18px ${color}18`,
        }}>
            <span className="max-w-full truncate px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                {mapping.label || mapping.element_id}
            </span>
            <div className="max-w-full truncate px-1 font-mono text-lg font-bold tabular-nums" style={{ color }}>
                {formatValue(mapping, value)}
            </div>
            <span className="text-[9px] uppercase tracking-wide text-slate-500">{mapping.data_source}</span>
        </div>
    );
}

function ValveElement({ mapping, sensorData }: { mapping: ScadaMapping; sensorData?: SensorData }) {
    const value = getSensorValue(mapping, sensorData);
    const isAvailable = value !== null;
    const isOpen = isSourceActive(mapping, value);
    const color = !isAvailable ? '#64748b' : isOpen ? mapping.normal_color : mapping.critical_color;

    return (
        <div className="flex h-full w-full flex-col items-center justify-center rounded-md bg-slate-900/80">
            <svg viewBox="0 0 60 80" className="w-3/4 h-3/4">
                <rect x="25" y="0" width="10" height="20" fill="#94a3b8" stroke="#334155" rx="2" />
                <polygon points="30,25 10,65 50,65" fill={color} opacity={isOpen ? 0.9 : 0.3} stroke={color} strokeWidth="2" />
                {isOpen && <line x1="15" y1="45" x2="45" y2="45" stroke="white" strokeWidth="3" />}
                <rect x="25" y="65" width="10" height="15" fill="#94a3b8" stroke="#334155" rx="2" />
            </svg>
            <span className="max-w-full truncate px-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color }}>
                {mapping.label || mapping.element_id}: {!isAvailable ? 'N/A' : isOpen ? 'OPEN' : 'CLOSED'}
            </span>
        </div>
    );
}

function PumpElement({ mapping, sensorData }: { mapping: ScadaMapping; sensorData?: SensorData }) {
    const value = getSensorValue(mapping, sensorData);
    const isAvailable = value !== null;
    const isOn = isSourceActive(mapping, value);
    const color = isOn ? mapping.normal_color : '#64748b';

    return (
        <div className="flex h-full w-full flex-col items-center justify-center rounded-md bg-slate-900/80">
            <svg viewBox="0 0 60 60" className={`w-3/4 h-3/4 ${isOn ? 'animate-spin' : ''}`}
                style={{ animationDuration: '2s' }}>
                <circle cx="30" cy="30" r="25" fill="#0f172a" stroke={color} strokeWidth="2" />
                <circle cx="30" cy="30" r="8" fill={color} />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                    <line key={angle} x1="30" y1="30" x2={30 + 17 * Math.cos((angle * Math.PI) / 180)}
                        y2={30 + 17 * Math.sin((angle * Math.PI) / 180)} stroke={color} strokeWidth="2" />
                ))}
            </svg>
            <span className="max-w-full truncate px-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color }}>
                {mapping.label || mapping.element_id}: {!isAvailable ? 'N/A' : isOn ? 'RUN' : 'STOP'}
            </span>
        </div>
    );
}

function TankElement({ mapping, sensorData }: { mapping: ScadaMapping; sensorData?: SensorData }) {
    const value = getSensorValue(mapping, sensorData);
    const color = getStatusColor(mapping, value);
    const { min, max, unit } = getGaugeDefinition(mapping.data_source);
    const numVal = typeof value === 'number' ? value : min;
    const pct = Math.min(100, Math.max(0, ((numVal - min) / (max - min)) * 100));
    const displayValue = value === null ? '--' : `${formatValue(mapping, value)}${unit}`;

    return (
        <div className="flex h-full w-full flex-col items-center justify-center rounded-md bg-slate-900/80">
            <svg viewBox="0 0 80 100" className="w-3/4 h-3/4">
                <rect x="10" y="15" width="60" height="70" rx="5" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
                <rect x="10" y={85 - (pct / 100) * 70} width="60" height={(pct / 100) * 70} rx="3" fill={color} opacity="0.4" />
                <rect x="10" y={85 - (pct / 100) * 70} width="60" height="4" fill={color} />
                <text x="40" y="55" textAnchor="middle" fill={color} fontSize="12" fontWeight="bold">{displayValue}</text>
            </svg>
            {mapping.label && <span className="max-w-full truncate px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300">{mapping.label}</span>}
        </div>
    );
}

function LabelElement({ mapping }: { mapping: ScadaMapping }) {
    return (
        <div className="flex h-full w-full items-center justify-center rounded border border-slate-700 bg-slate-900/75">
            <span className="max-w-full truncate px-2 text-sm font-semibold uppercase tracking-wide text-slate-200">
                {mapping.label || mapping.element_id}
            </span>
        </div>
    );
}

function IndicatorElement({ mapping, sensorData }: { mapping: ScadaMapping; sensorData?: SensorData }) {
    const value = getSensorValue(mapping, sensorData);
    const isActive = isSourceActive(mapping, value);
    const color = isActive ? mapping.normal_color : '#475569';
    const status = value === null ? 'N/A' : typeof value === 'boolean' ? formatBoolean(mapping.data_source, value) : (isActive ? 'ON' : 'OFF');

    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-md border border-slate-700 bg-slate-900/85">
            <div
                className={`h-4 w-4 rounded-full border border-white/20 ${isActive ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: color, boxShadow: isActive ? `0 0 12px ${color}` : 'none' }}
                data-testid="scada-indicator-light"
                data-state={isActive ? 'active' : 'idle'}
            />
            <span className="max-w-full truncate px-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color }}>
                {mapping.label || mapping.element_id}: {status}
            </span>
        </div>
    );
}

function PipeElement({ mapping, sensorData }: { mapping: ScadaMapping; sensorData?: SensorData }) {
    const value = getSensorValue(mapping, sensorData);
    const isAvailable = value !== null;
    const isActive = isSourceActive(mapping, value);
    const activeColor = mapping.normal_color || '#22d3ee';

    return (
        <div
            className="flex h-full w-full items-center justify-center"
            data-testid="scada-pipe"
            data-state={!isAvailable ? 'unavailable' : isActive ? 'active' : 'idle'}
            aria-label={`${mapping.label || mapping.element_id}: ${!isAvailable ? 'UNAVAILABLE' : isActive ? 'FLOW' : 'NO FLOW'}`}
        >
            <div className="relative h-3 w-full overflow-hidden rounded-full border border-slate-400 bg-slate-700 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]">
                <div className="absolute inset-[2px] rounded-full bg-slate-900" />
                {isActive && (
                    <div
                        className="absolute inset-[2px] animate-pulse rounded-full"
                        style={{
                            backgroundColor: `${activeColor}80`,
                            boxShadow: `0 0 10px ${activeColor}`,
                        }}
                        data-testid="scada-pipe-flow"
                    />
                )}
            </div>
        </div>
    );
}

const elementRenderers: Record<string, React.FC<{ mapping: ScadaMapping; sensorData?: SensorData }>> = {
    gauge: GaugeElement,
    display: DisplayElement,
    valve: ValveElement,
    pump: PumpElement,
    tank: TankElement,
    label: LabelElement,
    indicator: IndicatorElement,
    pipe: PipeElement,
};

export default function ScadaElement({ mapping, sensorData, className = '', selected, onSelect }: ScadaElementProps) {
    const Renderer = elementRenderers[mapping.element_type] || DisplayElement;

    return (
        <div
            className={`absolute isolate select-none overflow-hidden rounded ${selected ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-950' : ''} ${onSelect ? 'cursor-pointer hover:ring-1 hover:ring-cyan-300' : ''} ${className}`}
            style={{
                left: mapping.position_x,
                top: mapping.position_y,
                width: mapping.width,
                height: mapping.height,
                zIndex: mapping.z_index,
                transform: mapping.rotation ? `rotate(${mapping.rotation}deg)` : undefined,
            }}
            onClick={() => onSelect?.(mapping.id)}
            data-testid={`scada-element-${mapping.element_id}`}
        >
            <Renderer mapping={mapping} sensorData={sensorData} />
        </div>
    );
}
