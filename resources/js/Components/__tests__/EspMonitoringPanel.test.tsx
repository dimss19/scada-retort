import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import EspMonitoringPanel, { calculateLethality } from '../Esp/EspMonitoringPanel';

describe('EspMonitoringPanel Component', () => {
    it('calculates F0 lethality correctly based on standard Bigelow equation', () => {
        // Below 100 C -> Lethality is 0
        expect(calculateLethality(90)).toBe(0);
        // At 121.1 C -> Lethality is 1.0
        expect(calculateLethality(121.1)).toBeCloseTo(1.0, 3);
        // At 121.0 C -> Lethality is 10^((121-121.1)/10) ~ 0.9772
        expect(calculateLethality(121.0)).toBeCloseTo(0.9772, 3);
    });

    it('renders PV, SV, Machine Status, Valve MV and F0 values correctly', () => {
        const telemetry = {
            machine_code: 'RT-001',
            pv: 121.5,
            sv: 121.0,
            mv: 100,
            phase: 'STERILIZING',
            tot: '12:34',
            stp: '05:00',
            ps: '02.01',
        };

        render(<EspMonitoringPanel telemetry={telemetry} isOnline={true} f0Value={4.25} />);

        // PV display
        expect(screen.getByText('121.5')).toBeInTheDocument();
        // SV display
        expect(screen.getByText('121.0')).toBeInTheDocument();
        // Online status
        expect(screen.getByText('ONLINE')).toBeInTheDocument();
        // Valve MV open
        expect(screen.getByText('Terbuka (100%)')).toBeInTheDocument();
        // Sterilizing phase badge
        expect(screen.getByText('STERILISASI (HOLDING)')).toBeInTheDocument();
        // Timers
        expect(screen.getByText('12:34')).toBeInTheDocument();
        expect(screen.getByText('05:00')).toBeInTheDocument();
        // F0 value
        expect(screen.getByText('4.25')).toBeInTheDocument();
    });
});
