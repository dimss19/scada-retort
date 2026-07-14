export interface ScadaMapping {
    id: number;
    device_id: number;
    element_id: string;
    data_source: string;
    normal_color: string;
    warning_color: string;
    critical_color: string;
    warning_threshold: number | null;
    critical_threshold: number | null;
    module_dependency: string | null;
    created_at: string;
    updated_at: string;
}

export interface ScadaMappingFormData {
    mappings: Partial<ScadaMapping>[];
}

export interface SensorData {
    pv?: number;
    sv?: number;
    mv?: number;
    phase?: string;
    run?: boolean;
    logging?: boolean;
    iso?: boolean;
    [key: string]: any;
}
