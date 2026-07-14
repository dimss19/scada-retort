import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OtaDeployStatus from '../OtaDeployStatus';
import { OtaStatus } from '@/types';

describe('OtaDeployStatus Component', () => {
    const mockDeployment = {
        id: 1,
        device_id: 1,
        firmware_file_id: 1,
        status: OtaStatus.FLASHING,
        progress: 45,
        started_at: new Date().toISOString(),
        completed_at: null,
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    it('renders progress correctly', () => {
        render(<OtaDeployStatus deployment={mockDeployment} />);
        expect(screen.getByText('45%')).toBeInTheDocument();
        expect(screen.getByText('flashing')).toBeInTheDocument();
    });

    it('shows error message if failed', () => {
        const failedDeployment = { ...mockDeployment, status: OtaStatus.FAILED, error_message: 'Checksum mismatch' };
        render(<OtaDeployStatus deployment={failedDeployment} />);
        expect(screen.getByText('Checksum mismatch')).toBeInTheDocument();
    });
});
