import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PinConfigForm from '../PinConfigForm';
import { PinFunction } from '@/types';

describe('PinConfigForm Component', () => {
    const mockInitialConfigs = [
        { function: PinFunction.RS485_RX, gpio_pin: 16 }
    ];

    it('renders initial configs', () => {
        render(<PinConfigForm initialConfigs={mockInitialConfigs} onSave={() => {}} />);
        expect(screen.getByDisplayValue(PinFunction.RS485_RX)).toBeInTheDocument();
        expect(screen.getByDisplayValue('16')).toBeInTheDocument();
    });

    it('can add a new pin row', () => {
        render(<PinConfigForm initialConfigs={mockInitialConfigs} onSave={() => {}} />);
        const addButton = screen.getByText('+ Add Pin');
        
        fireEvent.click(addButton);
        
        const pinInputs = screen.getAllByRole('spinbutton');
        expect(pinInputs).toHaveLength(2);
    });
    
    it('submits correctly', () => {
        const handleSave = vi.fn();
        render(<PinConfigForm initialConfigs={mockInitialConfigs} onSave={handleSave} />);
        
        const saveButton = screen.getByText('Save Configuration');
        fireEvent.click(saveButton);
        
        expect(handleSave).toHaveBeenCalledWith([{ function: PinFunction.RS485_RX, gpio_pin: 16 }]);
    });
});
