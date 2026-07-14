export enum PinFunction {
    RS485_RX = 'RS485_RX',
    RS485_TX = 'RS485_TX',
    DI1_TRIGGER = 'DI1_TRIGGER',
    SD_CS = 'SD_CS',
    SD_MOSI = 'SD_MOSI',
    SD_CLK = 'SD_CLK',
    SD_MISO = 'SD_MISO',
    RTC_SDA = 'RTC_SDA',
    RTC_SCL = 'RTC_SCL',
}

export interface PinConfig {
    id: number;
    device_id: number;
    function: PinFunction;
    gpio_pin: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PinConfigFormData {
    configs: {
        function: PinFunction;
        gpio_pin: number;
    }[];
}
