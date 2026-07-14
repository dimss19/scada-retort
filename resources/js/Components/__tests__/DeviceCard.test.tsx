import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DeviceCard from '../DeviceCard';

const mockDevice = {
    id: 1,
    machine_code: 'MC-001',
    name: 'Test Device',
    mqtt_broker: 'mqtt.example.com',
    mqtt_port: 1883,
    firmware_version: '1.0.0',
    is_online: true,
    last_seen_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
};

describe('DeviceCard Component', () => {
    it('renders device information', () => {
        render(<DeviceCard device={mockDevice} />);
        expect(screen.getByText('Test Device')).toBeInTheDocument();
        expect(screen.getByText('MC-001')).toBeInTheDocument();
        expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        const handleClick = vi.fn();
        render(<DeviceCard device={mockDevice} onClick={handleClick} />);
        
        fireEvent.click(screen.getByTestId('device-card-1'));
        expect(handleClick).toHaveBeenCalledWith(mockDevice);
    });

    it('displays sensor data when provided', () => {
        const sensorData = { pv: 100.5, phase: 'heating' };
        render(<DeviceCard device={mockDevice} sensorData={sensorData} />);
        
        expect(screen.getByText('100.5°C')).toBeInTheDocument();
        expect(screen.getByText('heating')).toBeInTheDocument();
    });
});
