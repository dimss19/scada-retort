import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../StatusBadge';

describe('StatusBadge Component', () => {
    it('renders online status correctly', () => {
        render(<StatusBadge status="online" />);
        const badge = screen.getByText(/online/i);
        expect(badge).toBeInTheDocument();
        expect(badge.className).toContain('bg-green-100');
    });

    it('renders offline status correctly', () => {
        render(<StatusBadge status="offline" />);
        const badge = screen.getByText(/offline/i);
        expect(badge).toBeInTheDocument();
        expect(badge.className).toContain('bg-gray-100');
    });

    it('renders stale status correctly', () => {
        render(<StatusBadge status="stale" />);
        const badge = screen.getByText(/stale/i);
        expect(badge).toBeInTheDocument();
        expect(badge.className).toContain('bg-yellow-100');
    });
});
