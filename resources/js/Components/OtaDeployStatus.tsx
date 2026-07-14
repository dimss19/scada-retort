import React from 'react';
import { OtaDeployment, OtaStatus } from '@/types';

interface OtaDeployStatusProps {
    deployment: OtaDeployment;
    className?: string;
}

export default function OtaDeployStatus({ deployment, className = '' }: OtaDeployStatusProps) {
    const getStatusColor = () => {
        switch (deployment.status) {
            case OtaStatus.SUCCESS:
                return 'text-green-600 bg-green-100 border-green-200';
            case OtaStatus.FAILED:
            case OtaStatus.ROLLBACK:
                return 'text-red-600 bg-red-100 border-red-200';
            case OtaStatus.FLASHING:
            case OtaStatus.DOWNLOADING:
                return 'text-blue-600 bg-blue-100 border-blue-200';
            case OtaStatus.PENDING:
            default:
                return 'text-gray-600 bg-gray-100 border-gray-200';
        }
    };

    const isProcessing = [OtaStatus.DOWNLOADING, OtaStatus.FLASHING].includes(deployment.status);

    return (
        <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 ${className}`} data-testid="ota-deploy-status">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Deployment Status</h4>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${getStatusColor()}`}>
                    {deployment.status}
                </span>
            </div>
            
            <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{deployment.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
                    <div 
                        className={`h-2 rounded-full transition-all duration-500 ${isProcessing ? 'bg-blue-600 animate-pulse' : (deployment.status === OtaStatus.SUCCESS ? 'bg-green-600' : (deployment.status === OtaStatus.PENDING ? 'bg-gray-400' : 'bg-red-600'))}`} 
                        style={{ width: `${deployment.progress}%` }}
                    ></div>
                </div>
            </div>

            {deployment.error_message && (
                <div className="mt-3 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                    <span className="font-semibold">Error:</span> {deployment.error_message}
                </div>
            )}
            
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                {deployment.started_at && <p>Started: {new Date(deployment.started_at).toLocaleString()}</p>}
                {deployment.completed_at && <p>Completed: {new Date(deployment.completed_at).toLocaleString()}</p>}
            </div>
        </div>
    );
}
