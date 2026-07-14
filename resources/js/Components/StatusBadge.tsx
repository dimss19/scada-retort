import React from 'react';

type Status = 'online' | 'offline' | 'stale';

interface StatusBadgeProps {
    status: Status;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
    const getBadgeStyle = () => {
        switch (status) {
            case 'online':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'offline':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'stale':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getSizeStyle = () => {
        switch (size) {
            case 'sm':
                return 'px-2 py-0.5 text-xs';
            case 'lg':
                return 'px-3 py-1 text-sm';
            case 'md':
            default:
                return 'px-2.5 py-0.5 text-sm';
        }
    };

    const getIcon = () => {
        if (status === 'stale') {
            return (
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            );
        }
        return (
            <span className={`w-2 h-2 mr-1.5 rounded-full ${status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
        );
    };

    return (
        <span className={`inline-flex items-center font-medium border rounded-full ${getBadgeStyle()} ${getSizeStyle()} ${className}`}>
            {getIcon()}
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}
