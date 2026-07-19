import { describe, expect, it } from 'vitest';
import {
    buildRetortEvents,
    buildRetortTelemetry,
    formatControllerTime,
    getAlarmIds,
    toEngineeringValue,
    toOutputPercent,
} from '../retortTelemetry';

describe('retort telemetry normalization', () => {
    it('converts raw TN values into engineering units', () => {
        expect(toEngineeringValue(1210, 1)).toBe(121);
        expect(toEngineeringValue(987, 2)).toBe(9.87);
        expect(toOutputPercent(725)).toBe(72.5);
        expect(toOutputPercent(1500)).toBe(100);
    });

    it('rejects TN sensor sentinel values', () => {
        expect(toEngineeringValue(31000, 0)).toBeNull();
        expect(toEngineeringValue(30000, 0)).toBeNull();
        expect(toEngineeringValue(-30000, 0)).toBeNull();
    });

    it('decodes alarms from either accessor data or raw bits', () => {
        expect(getAlarmIds({ alarms: { al1: true, al2: false, al3: true } })).toEqual(['AL1', 'AL3']);
        expect(getAlarmIds({ alarm_bits: 0b100010 })).toEqual(['AL2', 'AL6']);
    });

    it('keeps STOP semantics and prioritizes cooling phase', () => {
        const stopped = buildRetortTelemetry({ run_status: true, pv: 1000, sv: 1210, decimal_point: 1 }, true);
        expect(stopped.running).toBe(false);
        expect(stopped.phase).toBe('Waiting');

        const cooling = buildRetortTelemetry({
            run_status: false,
            pv: 900,
            sv: 1210,
            decimal_point: 1,
            cooling_mv: 450,
            out2_active: true,
        }, true);
        expect(cooling.running).toBe(true);
        expect(cooling.coolingPercent).toBe(45);
        expect(cooling.phase).toBe('Cooling');
    });

    it('reports sensor faults as alarms without inventing physical alarm names', () => {
        const telemetry = buildRetortTelemetry({ pv: 31000, sv: 1210, decimal_point: 1 }, true);
        expect(telemetry.actualTemperature).toBeNull();
        expect(telemetry.sensorFault).toContain('Sensor');
        expect(telemetry.alarmActive).toBe(true);
        expect(telemetry.phase).toBe('Alarm');
    });

    it('formats TN controller time and derives transition events', () => {
        expect(formatControllerTime(1234)).toBe('12:34');
        expect(formatControllerTime(null)).toBe('--:--');

        const events = buildRetortEvents([
            { created_at: '2026-07-19T01:00:00Z', run_status: true, heating_mv: 0, step_current: 1 },
            { created_at: '2026-07-19T01:00:01Z', run_status: false, heating_mv: 500, step_current: 2 },
        ]);

        expect(events.map((event) => event.label)).toEqual(expect.arrayContaining([
            'Controller RUN',
            'Heating output ON',
            'Step berubah ke 2',
        ]));
    });
});
