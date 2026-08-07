export type RetortPhase = 'Offline' | 'Alarm' | 'Waiting' | 'Heating' | 'Holding' | 'Cooling' | 'Running';

export interface RetortTelemetry {
    actualTemperature: number | null;
    targetTemperature: number | null;
    heatingPercent: number | null;
    coolingPercent: number | null;
    running: boolean;
    automatic: boolean;
    heatingActive: boolean;
    coolingActive: boolean;
    sensorFault: string | null;
    activeAlarms: string[];
    alarmActive: boolean;
    phase: RetortPhase;
    pattern: number | null;
    step: number | null;
    processTime: number | null;
    remainingTime: number | null;
    timestamp: string | null;
}

export interface RetortEvent {
    id: string;
    timestamp: string | null;
    label: string;
    tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
}

const SENSOR_FAULTS: Record<number, string> = {
    31000: 'Sensor open / terputus',
    30000: 'Suhu melewati batas atas',
    [-30000]: 'Suhu melewati batas bawah',
};

export function toEngineeringValue(value: unknown, decimalPoint: unknown = 0): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value) || SENSOR_FAULTS[value]) {
        return null;
    }

    const decimals = typeof decimalPoint === 'number' && Number.isFinite(decimalPoint)
        ? Math.max(0, Math.min(4, Math.trunc(decimalPoint)))
        : 0;

    return value / Math.pow(10, decimals);
}

export function toOutputPercent(value: unknown): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    return Math.max(0, Math.min(100, value / 10));
}

export function getAlarmIds(reading: any): string[] {
    if (!reading) return [];

    if (reading.alarms && typeof reading.alarms === 'object') {
        return Object.entries(reading.alarms)
            .filter(([, active]) => Boolean(active))
            .map(([key]) => key.toUpperCase());
    }

    const bits = Number(reading.alarm_bits ?? 0);
    if (!Number.isFinite(bits)) return [];

    return Array.from({ length: 7 }, (_, index) => index)
        .filter((index) => (bits & (1 << index)) !== 0)
        .map((index) => `AL${index + 1}`);
}

export function buildRetortTelemetry(reading: any, isOnline: boolean): RetortTelemetry {
    const decimalPoint = reading?.decimal_point ?? 0;
    const actualTemperature = toEngineeringValue(reading?.pv, decimalPoint);
    const targetTemperature = toEngineeringValue(reading?.sv, decimalPoint);
    const heatingPercent = toOutputPercent(reading?.heating_mv);
    const coolingPercent = toOutputPercent(reading?.cooling_mv);
    const isRunActive = reading && (reading.run_status === false || reading.run_status === 0 || reading.run_status === '0' || reading.run_status === 'false');
    const isAutoActive = reading && (reading.auto_manual === false || reading.auto_manual === 0 || reading.auto_manual === '0' || reading.auto_manual === 'false');
    const running = Boolean(isOnline && reading && isRunActive);
    const automatic = Boolean(reading && isAutoActive);
    const heatingActive = Boolean(running && (reading?.out1_active || (heatingPercent ?? 0) > 0));
    const coolingActive = Boolean(running && (reading?.out2_active || (coolingPercent ?? 0) > 0));
    const sensorFault = typeof reading?.pv === 'number' ? SENSOR_FAULTS[reading.pv] ?? null : null;
    const activeAlarms = getAlarmIds(reading);
    const alarmActive = Boolean(sensorFault || activeAlarms.length > 0);

    let phase: RetortPhase = 'Waiting';
    if (!isOnline) phase = 'Offline';
    else if (alarmActive) phase = 'Alarm';
    else if (!running) phase = 'Waiting';
    else if (coolingActive) phase = 'Cooling';
    else if (heatingActive) phase = 'Heating';
    else if (
        actualTemperature !== null
        && targetTemperature !== null
        && Math.abs(actualTemperature - targetTemperature) <= 1
    ) phase = 'Holding';
    else phase = 'Running';

    return {
        actualTemperature,
        targetTemperature,
        heatingPercent,
        coolingPercent,
        running,
        automatic,
        heatingActive,
        coolingActive,
        sensorFault,
        activeAlarms,
        alarmActive,
        phase,
        pattern: typeof reading?.pattern_current === 'number' ? reading.pattern_current : null,
        step: typeof reading?.step_current === 'number' ? reading.step_current : null,
        processTime: typeof reading?.process_time === 'number' ? reading.process_time : null,
        remainingTime: typeof reading?.rest_time === 'number' ? reading.rest_time : null,
        timestamp: reading?.created_at ?? reading?.timestamp ?? null,
    };
}

export function formatControllerTime(value: number | null | undefined): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return '--:--';
    const text = String(Math.max(0, Math.trunc(value))).padStart(4, '0');
    return `${text.slice(0, -2) || '0'}:${text.slice(-2)}`;
}

export function buildRetortEvents(readings: any[], limit = 12): RetortEvent[] {
    const events: RetortEvent[] = [];
    let previous: RetortTelemetry | null = null;

    readings.forEach((reading, index) => {
        const current = buildRetortTelemetry(reading, true);
        const timestamp = current.timestamp;
        const push = (label: string, tone: RetortEvent['tone']) => {
            events.push({
                id: `${timestamp ?? index}-${events.length}-${label}`,
                timestamp,
                label,
                tone,
            });
        };

        if (previous) {
            if (current.running !== previous.running) {
                push(current.running ? 'Controller RUN' : 'Controller STOP', current.running ? 'success' : 'neutral');
            }
            if (current.heatingActive !== previous.heatingActive) {
                push(`Heating output ${current.heatingActive ? 'ON' : 'OFF'}`, current.heatingActive ? 'warning' : 'neutral');
            }
            if (current.coolingActive !== previous.coolingActive) {
                push(`Cooling output ${current.coolingActive ? 'ON' : 'OFF'}`, current.coolingActive ? 'info' : 'neutral');
            }
            if (current.step !== previous.step && current.step !== null) {
                push(`Step berubah ke ${current.step}`, 'info');
            }

            const previousAlarms = new Set(previous.activeAlarms);
            current.activeAlarms
                .filter((alarm) => !previousAlarms.has(alarm))
                .forEach((alarm) => push(`${alarm} aktif`, 'danger'));

            if (current.sensorFault !== previous.sensorFault) {
                push(current.sensorFault ?? 'Sensor kembali normal', current.sensorFault ? 'danger' : 'success');
            }

            if (previous.alarmActive && !current.alarmActive) {
                push('Alarm kembali normal', 'success');
            }
        }

        previous = current;
    });

    return events.slice(-limit).reverse();
}
