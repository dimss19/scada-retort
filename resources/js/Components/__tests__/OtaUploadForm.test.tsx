import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OtaUploadForm from '../OtaUploadForm';

describe('OtaUploadForm Component', () => {
    it('disables submit button initially', () => {
        render(<OtaUploadForm onUpload={() => {}} />);
        const submitBtn = screen.getByRole('button', { name: /upload firmware/i });
        expect(submitBtn).toBeDisabled();
    });

    it('enables submit when file and version are provided', () => {
        const handleUpload = vi.fn();
        render(<OtaUploadForm onUpload={handleUpload} />);
        
        const versionInput = screen.getByPlaceholderText('e.g. 1.0.0');
        fireEvent.change(versionInput, { target: { value: '1.2.3' } });
        
        const fileInput = screen.getByLabelText(/firmware file/i);
        const file = new File(['test'], 'firmware.bin', { type: 'application/octet-stream' });
        fireEvent.change(fileInput, { target: { files: [file] } });
        
        const submitBtn = screen.getByRole('button', { name: /upload firmware/i });
        expect(submitBtn).not.toBeDisabled();
        
        fireEvent.submit(screen.getByTestId('ota-upload-form'));
        expect(handleUpload).toHaveBeenCalledWith(file, '1.2.3');
    });
});
