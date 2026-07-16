export interface TnController {
    id: number;
    name: string;
    slave_id: number;
    model_type: 'TNS' | 'TNH' | 'TNL';
    control_model: 'fixed' | 'program';
    serial_port: string | null;
    baudrate: number;
    parity: 'N' | 'E' | 'O';
    stopbits: number;
    is_online: boolean;
    last_seen_at: string | null;
    last_error: string | null;
    readings?: any[];
}
