export interface Device {
    id: number;
    machine_code: string;
    name: string;
    mqtt_broker: string;
    mqtt_port: number;
    firmware_version: string | null;
    is_online: boolean;
    last_seen_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface DeviceFormData {
    machine_code: string;
    name: string;
    mqtt_broker: string;
    mqtt_port: number;
}
