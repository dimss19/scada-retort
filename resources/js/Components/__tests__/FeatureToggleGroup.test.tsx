import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FeatureToggleGroup from '../FeatureToggleGroup';
import { ModuleName } from '@/types';

describe('FeatureToggleGroup Component', () => {
    const mockFeatures = [
        { module_name: ModuleName.MODBUS, enabled: true },
        { module_name: ModuleName.MQTT, enabled: false }
    ];

    it('renders feature toggles', () => {
        render(<FeatureToggleGroup initialFeatures={mockFeatures} onSave={() => {}} />);
        expect(screen.getByText('modbus')).toBeInTheDocument();
        expect(screen.getByText('mqtt')).toBeInTheDocument();
    });

    it('submits updated features', () => {
        const handleSave = vi.fn();
        render(<FeatureToggleGroup initialFeatures={mockFeatures} onSave={handleSave} />);
        
        const saveButton = screen.getByText('Save Features');
        fireEvent.click(saveButton);
        
        expect(handleSave).toHaveBeenCalled();
        // Since we didn't toggle anything, it should save the initial state for the provided mockFeatures
        // The component maps all available ModuleNames, so the length of array will be all modules.
        const savedData = handleSave.mock.calls[0][0];
        const modbus = savedData.find((f: any) => f.module_name === ModuleName.MODBUS);
        expect(modbus.enabled).toBe(true);
    });
});
