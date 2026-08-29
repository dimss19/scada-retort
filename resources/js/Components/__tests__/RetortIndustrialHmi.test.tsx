import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import RetortIndustrialHmi from '../Tn/RetortIndustrialHmi';
import { RetortTelemetry } from '@/Pages/Tn/retortTelemetry';

const dummyTelemetry: RetortTelemetry = {
    actualTemperature: 29.2,
    targetTemperature: 25.0,
    heatingPercent: 0,
    coolingPercent: 0,
    running: false,
    automatic: true,
    heatingActive: false,
    coolingActive: false,
    sensorFault: null,
    activeAlarms: ['AL1', 'AL3'],
    alarmActive: true,
    phase: 'Waiting',
    pattern: 2,
    step: 0,
    processTime: 0,
    remainingTime: 0,
    timestamp: '2026-08-29T09:00:00Z',
};

describe('RetortIndustrialHmi Component', () => {
    it('correctly displays engineering PV 29.2 and SV 25.0 instead of raw unscaled integers', () => {
        render(
            <RetortIndustrialHmi
                controllerModel="TNH"
                telemetry={dummyTelemetry}
                sensorData={{
                    pv: 292,
                    sv: 250,
                    decimal_point: 1,
                }}
            />
        );

        expect(screen.getByText('29.2')).toBeInTheDocument();
        expect(screen.getByText('25.0')).toBeInTheDocument();
        expect(screen.queryByText('292.0')).not.toBeInTheDocument();
        expect(screen.queryByText('250.0')).not.toBeInTheDocument();
    });

    it('renders POWER ON lamp indicating online connection status', () => {
        const { rerender } = render(
            <RetortIndustrialHmi
                controllerModel="TNH"
                telemetry={dummyTelemetry}
                isOnline={true}
            />
        );

        expect(screen.getByText('POWER ON')).toBeInTheDocument();
        expect(screen.getByText('ONLINE / CONNECTED')).toBeInTheDocument();
        expect(screen.getByText('ON')).toBeInTheDocument();

        rerender(
            <RetortIndustrialHmi
                controllerModel="TNH"
                telemetry={dummyTelemetry}
                isOnline={false}
            />
        );

        expect(screen.getByText('DISCONNECTED')).toBeInTheDocument();
        expect(screen.getByText('OFF')).toBeInTheDocument();
    });

    it('adapts alarm lamp count based on model: TNS (2), TNH (4), TNL (6)', () => {
        const { rerender } = render(
            <RetortIndustrialHmi
                controllerModel="TNS"
                telemetry={dummyTelemetry}
            />
        );

        expect(screen.getByText('ALARM 1')).toBeInTheDocument();
        expect(screen.getByText('ALARM 2')).toBeInTheDocument();
        expect(screen.queryByText('ALARM 3')).not.toBeInTheDocument();
        expect(screen.queryByText('ALARM 4')).not.toBeInTheDocument();

        // TNH has 4 alarms
        rerender(
            <RetortIndustrialHmi
                controllerModel="TNH"
                telemetry={dummyTelemetry}
            />
        );
        expect(screen.getByText('ALARM 3')).toBeInTheDocument();
        expect(screen.getByText('ALARM 4')).toBeInTheDocument();
        expect(screen.queryByText('ALARM 5')).not.toBeInTheDocument();

        // TNL has 6 alarms
        rerender(
            <RetortIndustrialHmi
                controllerModel="TNL"
                telemetry={dummyTelemetry}
            />
        );
        expect(screen.getByText('ALARM 5')).toBeInTheDocument();
        expect(screen.getByText('ALARM 6')).toBeInTheDocument();
    });
});
