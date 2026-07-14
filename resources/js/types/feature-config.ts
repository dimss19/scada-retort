export enum ModuleName {
    MODBUS = 'modbus',
    FAKE_SENSOR = 'fake_sensor',
    MQTT = 'mqtt',
    SD_LOGGER = 'sd_logger',
    RTC = 'rtc',
    OTA = 'ota',
    MV_SIMULATION = 'mv_simulation',
}

export interface FeatureConfig {
    id: number;
    device_id: number;
    module_name: ModuleName;
    enabled: boolean;
    created_at: string;
    updated_at: string;
}

export interface FeatureConfigFormData {
    features: {
        module_name: ModuleName;
        enabled: boolean;
    }[];
}
