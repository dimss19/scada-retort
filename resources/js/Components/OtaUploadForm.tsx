import React, { useState, useRef } from 'react';
import PrimaryButton from './PrimaryButton';

interface OtaUploadFormProps {
    onUpload: (file: File, version: string) => void;
    isUploading?: boolean;
    progress?: number;
}

export default function OtaUploadForm({ onUpload, isUploading = false, progress = 0 }: OtaUploadFormProps) {
    const [file, setFile] = useState<File | null>(null);
    const [version, setVersion] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (file && version) {
            onUpload(file, version);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="ota-upload-form">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Upload Firmware</h3>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="version" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Version</label>
                        <input
                            id="version"
                            type="text"
                            placeholder="e.g. 1.0.0"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={version}
                            onChange={(e) => setVersion(e.target.value)}
                            required
                            disabled={isUploading}
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="firmware-file" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Firmware File (.bin)</label>
                        <input
                            id="firmware-file"
                            type="file"
                            accept=".bin"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-300"
                            required
                            disabled={isUploading}
                        />
                    </div>

                    {isUploading && progress > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4">
                            <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                            <p className="text-xs text-center mt-1 text-gray-500 dark:text-gray-400">{progress}%</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end">
                <PrimaryButton type="submit" disabled={isUploading || !file || !version}>
                    {isUploading ? 'Uploading...' : 'Upload Firmware'}
                </PrimaryButton>
            </div>
        </form>
    );
}
