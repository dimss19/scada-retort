import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScadaElement from '../ScadaElement';

describe('ScadaElement Component', () => {
    const mockMapping = {
        id: 1,
        device_id: 1,
        element_id: 'TEMP_01',
        element_type: 'display' as const,
        label: null,
        data_source: 'pv',
        position_x: 0,
        position_y: 0,
        width: 120,
        height: 80,
        rotation: 0,
        z_index: 0,
        normal_color: '#00ff00',
        warning_color: '#ffff00',
        critical_color: '#ff0000',
        warning_threshold: 80,
        critical_threshold: 100,
        module_dependency: null,
        created_at: '',
        updated_at: ''
    };

    it('renders with normal color when below warning', () => {
        const sensorData = { pv: 50 };
        render(<ScadaElement mapping={mockMapping} sensorData={sensorData} />);
        
        expect(screen.getByText('TEMP_01')).toBeInTheDocument();
        expect(screen.getByText('50.0')).toBeInTheDocument();
    });

    it('renders with critical color when above critical threshold', () => {
        const sensorData = { pv: 105 };
        const { container } = render(<ScadaElement mapping={mockMapping} sensorData={sensorData} />);
        const valElement = screen.getByText('105.0');
        expect(valElement).toBeInTheDocument();
    });
    
    it('renders fallback when no data available', () => {
        render(<ScadaElement mapping={mockMapping} />);
        expect(screen.getByText('--')).toBeInTheDocument();
    });

    it('formats boolean values as equipment states', () => {
        const booleanMapping = {
            ...mockMapping,
            element_id: 'HEATER_OUTPUT',
            data_source: 'out1_active',
        };
        const { rerender } = render(<ScadaElement mapping={booleanMapping} sensorData={{ out1_active: true }} />);

        expect(screen.getByText('ON')).toBeInTheDocument();

        rerender(<ScadaElement mapping={booleanMapping} sensorData={{ out1_active: false }} />);
        expect(screen.getByText('OFF')).toBeInTheDocument();
    });

    it('uses the TN RUN/STOP labels for run_status', () => {
        const runMapping = {
            ...mockMapping,
            element_id: 'RUN_STATUS',
            data_source: 'run_status',
        };
        const { rerender } = render(<ScadaElement mapping={runMapping} sensorData={{ run_status: false }} />);

        expect(screen.getByText('RUN')).toBeInTheDocument();

        rerender(<ScadaElement mapping={runMapping} sensorData={{ run_status: true }} />);
        expect(screen.getByText('STOP')).toBeInTheDocument();
    });

    it('shows animated flow when a pipe source is active', () => {
        const pipeMapping = {
            ...mockMapping,
            element_id: 'STEAM_PIPE',
            element_type: 'pipe' as const,
            label: 'Steam Pipe',
            data_source: 'out1_active',
            height: 20,
        };

        render(<ScadaElement mapping={pipeMapping} sensorData={{ out1_active: true }} />);

        expect(screen.getByTestId('scada-pipe')).toHaveAttribute('data-state', 'active');
        expect(screen.getByTestId('scada-pipe-flow')).toHaveClass('animate-pulse');
    });

    it('keeps a pipe static when its source is inactive', () => {
        const pipeMapping = {
            ...mockMapping,
            element_id: 'STEAM_PIPE',
            element_type: 'pipe' as const,
            label: 'Steam Pipe',
            data_source: 'out1_active',
            height: 20,
        };

        render(<ScadaElement mapping={pipeMapping} sensorData={{ out1_active: false }} />);

        expect(screen.getByTestId('scada-pipe')).toHaveAttribute('data-state', 'idle');
        expect(screen.queryByTestId('scada-pipe-flow')).not.toBeInTheDocument();
    });

    it('marks physical I/O without a source value as unavailable', () => {
        const valveMapping = {
            ...mockMapping,
            element_id: 'STEAM_VALVE',
            element_type: 'valve' as const,
            label: 'Steam Valve',
            data_source: 'steam_valve',
        };
        const { rerender } = render(<ScadaElement mapping={valveMapping} sensorData={{}} />);
        expect(screen.getByText('Steam Valve: N/A')).toBeInTheDocument();

        const pipeMapping = {
            ...valveMapping,
            element_id: 'STEAM_PIPE',
            element_type: 'pipe' as const,
            label: 'Steam Pipe',
        };
        rerender(<ScadaElement mapping={pipeMapping} sensorData={{}} />);
        expect(screen.getByTestId('scada-pipe')).toHaveAttribute('data-state', 'unavailable');
    });

    it('does not pulse an inactive indicator', () => {
        const indicatorMapping = {
            ...mockMapping,
            element_id: 'STEAM_LAMP',
            element_type: 'indicator' as const,
            data_source: 'out1_active',
        };

        render(<ScadaElement mapping={indicatorMapping} sensorData={{ out1_active: false }} />);

        expect(screen.getByTestId('scada-indicator-light')).toHaveAttribute('data-state', 'idle');
        expect(screen.getByTestId('scada-indicator-light')).not.toHaveClass('animate-pulse');
    });

    it('applies decimal_point to raw PV values and formats TN process time', () => {
        const { rerender } = render(
            <ScadaElement mapping={mockMapping} sensorData={{ pv: 1234, decimal_point: 1 }} />
        );
        expect(screen.getByText('123.4')).toBeInTheDocument();

        const timeMapping = {
            ...mockMapping,
            element_id: 'REST_TIME',
            data_source: 'rest_time',
        };
        rerender(<ScadaElement mapping={timeMapping} sensorData={{ rest_time: 1234 }} />);
        expect(screen.getByText('12:34')).toBeInTheDocument();
    });
});
