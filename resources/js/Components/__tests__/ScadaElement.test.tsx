import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScadaElement from '../ScadaElement';

describe('ScadaElement Component', () => {
    const mockMapping = {
        id: 1,
        device_id: 1,
        element_id: 'TEMP_01',
        data_source: 'pv',
        normal_color: '#00ff00',
        warning_color: '#ffff00',
        critical_color: '#ff0000',
        warning_threshold: 80,
        critical_threshold: 100,
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
        
        // Element should have critical color
        const valElement = screen.getByText('105.0');
        expect(valElement).toHaveStyle({ color: 'rgb(255, 0, 0)' }); // #ff0000 -> rgb(255, 0, 0)
    });
    
    it('renders fallback when no data available', () => {
        render(<ScadaElement mapping={mockMapping} />);
        expect(screen.getByText('--')).toBeInTheDocument();
    });
});
