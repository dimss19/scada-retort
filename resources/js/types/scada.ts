export type ScadaElementType = 'gauge' | 'valve' | 'pump' | 'tank' | 'pipe' | 'label' | 'display' | 'indicator';

export interface ScadaMapping {
    id: number;
    tn_controller_id?: number;
    device_id?: number;
    element_id: string;
    element_type: ScadaElementType;
    label: string | null;
    data_source: string;
    position_x: number;
    position_y: number;
    width: number;
    height: number;
    rotation: number;
    z_index: number;
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

export interface ScadaCanvas {
    id: number;
    tn_controller_id: number;
    background_image_url: string | null;
    width: number;
    height: number;
    grid_enabled: boolean;
    grid_size: number;
    snap_to_grid: boolean;
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
