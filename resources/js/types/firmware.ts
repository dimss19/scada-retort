export enum OtaStatus {
    PENDING = 'pending',
    DOWNLOADING = 'downloading',
    FLASHING = 'flashing',
    SUCCESS = 'success',
    FAILED = 'failed',
    ROLLBACK = 'rollback',
}

export interface FirmwareFile {
    id: number;
    filename: string;
    version: string;
    file_path: string;
    file_size: number;
    checksum_md5: string;
    uploaded_by: number | null;
    created_at: string;
    updated_at: string;
}

export interface OtaDeployment {
    id: number;
    device_id: number;
    firmware_file_id: number;
    status: OtaStatus;
    progress: number;
    started_at: string | null;
    completed_at: string | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
}

export interface OtaDeployFormData {
    device_id: number;
    firmware_file_id: number;
}
