/**
 * WebSerialModbus.ts
 * Client-side Modbus RTU Driver using Web Serial API (navigator.serial)
 * Enables direct RS485 communication with Autonics TN series controllers from the browser.
 */

export interface ModbusPortConfig {
    baudRate: number;
    dataBits?: 7 | 8;
    stopBits?: 1 | 2;
    parity?: 'none' | 'even' | 'odd';
    timeoutMs?: number;
}

export interface TnDecodedReading {
    pv: number;
    decimal_point: number;
    display_unit: number;
    sv: number;
    heating_mv: number;
    cooling_mv: number;
    status_flag: number;
    alarm_status: number;
    event_status: number;
    ct1_current?: number;
    ct2_current?: number;
    pattern_current: number;
    step_current: number;
    process_time: number;
    rest_time: number;
    run_status: 'RUN' | 'STOP' | 'RESET';
    auto_manual: 'AUTO' | 'MANUAL';
    raw_registers: number[];
    timestamp: string;
}

/**
 * Calculates standard Modbus RTU CRC16 checksum
 */
export function crc16Modbus(buffer: Uint8Array): number {
    let crc = 0xFFFF;
    for (let pos = 0; pos < buffer.length; pos++) {
        crc ^= buffer[pos];
        for (let i = 8; i !== 0; i--) {
            if ((crc & 0x0001) !== 0) {
                crc = (crc >> 1) ^ 0xA001;
            } else {
                crc = crc >> 1;
            }
        }
    }
    return crc;
}

/**
 * Builds Modbus RTU Read Input Registers (Function 0x04) request
 */
export function buildReadInputRegisters(slaveId: number, startAddress: number, count: number): Uint8Array {
    const frame = new Uint8Array(8);
    frame[0] = slaveId;
    frame[1] = 0x04; // Function 0x04
    frame[2] = (startAddress >> 8) & 0xFF;
    frame[3] = startAddress & 0xFF;
    frame[4] = (count >> 8) & 0xFF;
    frame[5] = count & 0xFF;

    const crc = crc16Modbus(frame.subarray(0, 6));
    frame[6] = crc & 0xFF;        // CRC Low
    frame[7] = (crc >> 8) & 0xFF; // CRC High
    return frame;
}

/**
 * Builds Modbus RTU Read Holding Registers (Function 0x03) request
 */
export function buildReadHoldingRegisters(slaveId: number, startAddress: number, count: number): Uint8Array {
    const frame = new Uint8Array(8);
    frame[0] = slaveId;
    frame[1] = 0x03; // Function 0x03
    frame[2] = (startAddress >> 8) & 0xFF;
    frame[3] = startAddress & 0xFF;
    frame[4] = (count >> 8) & 0xFF;
    frame[5] = count & 0xFF;

    const crc = crc16Modbus(frame.subarray(0, 6));
    frame[6] = crc & 0xFF;
    frame[7] = (crc >> 8) & 0xFF;
    return frame;
}

/**
 * Builds Modbus RTU Write Single Register (Function 0x06) request
 */
export function buildWriteSingleRegister(slaveId: number, address: number, value: number): Uint8Array {
    const frame = new Uint8Array(8);
    frame[0] = slaveId;
    frame[1] = 0x06; // Function 0x06
    frame[2] = (address >> 8) & 0xFF;
    frame[3] = address & 0xFF;
    frame[4] = (value >> 8) & 0xFF;
    frame[5] = value & 0xFF;

    const crc = crc16Modbus(frame.subarray(0, 6));
    frame[6] = crc & 0xFF;
    frame[7] = (crc >> 8) & 0xFF;
    return frame;
}

/**
 * Parses response bytes into 16-bit register numbers
 */
export function parseModbusResponse(response: Uint8Array, expectedSlave: number, expectedFunc: number): number[] {
    if (response.length < 5) {
        throw new Error(`Respons terlalu pendek: ${response.length} bytes`);
    }

    const slave = response[0];
    const func = response[1];

    if (slave !== expectedSlave) {
        throw new Error(`Slave ID mismatch (diterima ${slave}, diharapkan ${expectedSlave})`);
    }

    if (func === (expectedFunc | 0x80)) {
        const errCode = response[2];
        throw new Error(`Modbus Exception Response code: ${errCode}`);
    }

    if (func !== expectedFunc) {
        throw new Error(`Function code mismatch (diterima 0x${func.toString(16)}, diharapkan 0x${expectedFunc.toString(16)})`);
    }

    // Verify CRC
    const receivedCrc = response[response.length - 2] | (response[response.length - 1] << 8);
    const calculatedCrc = crc16Modbus(response.subarray(0, response.length - 2));
    if (receivedCrc !== calculatedCrc) {
        throw new Error(`CRC Checksum Error (diterima 0x${receivedCrc.toString(16)}, dihitung 0x${calculatedCrc.toString(16)})`);
    }

    const byteCount = response[2];
    const registers: number[] = [];
    for (let i = 0; i < byteCount; i += 2) {
        const high = response[3 + i];
        const low = response[3 + i + 1];
        const raw = (high << 8) | low;
        const signed = raw >= 0x8000 ? raw - 0x10000 : raw;
        registers.push(signed);
    }

    return registers;
}

/**
 * Decodes 27 monitoring registers (1000..1026) for Autonics TN Series
 */
export function decodeAutonicsTnReadings(reg: number[]): TnDecodedReading {
    const pv = reg[0] ?? 0;
    const decimalPoint = reg[1] ?? 0;
    const displayUnit = reg[2] ?? 0;
    const sv = reg[3] ?? 0;
    const heatingMv = reg[4] ?? 0;
    const coolingMv = reg[5] ?? 0;
    const statusFlag = reg[7] ?? 0;
    const alarmStatus = reg[11] ?? 0;
    const eventStatus = reg[10] ?? 0;
    const ct1 = reg[12] ?? 0;
    const ct2 = reg[13] ?? 0;
    const pattern = reg[19] ?? 0;
    const step = reg[20] ?? 0;
    const processTime = reg[21] ?? 0;
    const restTime = reg[23] ?? 0;

    // Decode status flags bitwise
    const isRun = (statusFlag & 0x01) !== 0;
    const isManual = (statusFlag & 0x04) !== 0;

    return {
        pv,
        decimal_point: decimalPoint,
        display_unit: displayUnit,
        sv,
        heating_mv: heatingMv,
        cooling_mv: coolingMv,
        status_flag: statusFlag,
        alarm_status: alarmStatus,
        event_status: eventStatus,
        ct1_current: ct1,
        ct2_current: ct2,
        pattern_current: pattern,
        step_current: step,
        process_time: processTime,
        rest_time: restTime,
        run_status: isRun ? 'RUN' : 'STOP',
        auto_manual: isManual ? 'MANUAL' : 'AUTO',
        raw_registers: reg,
        timestamp: new Date().toISOString(),
    };
}

export class WebSerialModbusDriver {
    private port: any = null;
    private reader: any = null;
    private isStreamReading = false;
    private rxBuffer: number[] = [];
    private isPolling = false;
    private pollingTimer: any = null;
    private isBusy = false;
    public currentConfig: ModbusPortConfig = { baudRate: 9600, dataBits: 8, stopBits: 2, parity: 'none' };

    public onReading?: (reading: TnDecodedReading) => void;
    public onStatusChange?: (status: 'disconnected' | 'connecting' | 'connected' | 'error', message?: string) => void;
    public onError?: (error: string) => void;

    public static isSupported(): boolean {
        return typeof navigator !== 'undefined' && 'serial' in navigator;
    }

    public async requestPort(): Promise<any> {
        if (!WebSerialModbusDriver.isSupported()) {
            throw new Error('Web Serial API tidak didukung di browser ini. Gunakan Google Chrome atau Microsoft Edge.');
        }
        return await (navigator as any).serial.requestPort();
    }

    private async startStreamReader(): Promise<void> {
        this.isStreamReading = true;
        while (this.port && this.isStreamReading && this.port.readable) {
            try {
                this.reader = this.port.readable.getReader();
                while (this.isStreamReading) {
                    const { value, done } = await this.reader.read();
                    if (done) break;
                    if (value && value.length > 0) {
                        for (let i = 0; i < value.length; i++) {
                            this.rxBuffer.push(value[i]);
                        }
                    }
                }
            } catch {
                break;
            } finally {
                if (this.reader) {
                    try {
                        this.reader.releaseLock();
                    } catch {}
                    this.reader = null;
                }
            }
        }
    }

    public async connect(selectedPort?: any, config?: Partial<ModbusPortConfig>): Promise<void> {
        this.currentConfig = {
            baudRate: config?.baudRate || 9600,
            dataBits: config?.dataBits || 8,
            stopBits: config?.stopBits || 2,
            parity: config?.parity || 'none',
        };

        this.onStatusChange?.('connecting', 'Membuka koneksi serial...');

        try {
            if (this.port) {
                try {
                    await this.disconnect();
                } catch {}
            }

            this.port = selectedPort || (await this.requestPort());

            if (!this.port) {
                throw new Error('Tidak ada port serial yang dipilih.');
            }

            // Try opening with specified parameters, fallback to stopBits 1 if driver rejects stopBits 2
            try {
                await this.port.open({
                    baudRate: this.currentConfig.baudRate,
                    dataBits: this.currentConfig.dataBits,
                    stopBits: this.currentConfig.stopBits,
                    parity: this.currentConfig.parity,
                    bufferSize: 2048,
                });
            } catch (openErr: any) {
                if (this.currentConfig.stopBits === 2) {
                    try {
                        this.currentConfig.stopBits = 1;
                        await this.port.open({
                            baudRate: this.currentConfig.baudRate,
                            dataBits: this.currentConfig.dataBits,
                            stopBits: 1,
                            parity: this.currentConfig.parity,
                            bufferSize: 2048,
                        });
                    } catch {
                        throw openErr;
                    }
                } else {
                    throw openErr;
                }
            }

            this.rxBuffer = [];
            this.startStreamReader();

            this.onStatusChange?.('connected', `Terhubung ke USB Serial (${this.currentConfig.baudRate} bps, StopBits: ${this.currentConfig.stopBits}, Parity: ${this.currentConfig.parity})`);
        } catch (err: any) {
            this.port = null;
            let msg = err?.message || 'Gagal membuka port serial.';
            if (msg.includes('Failed to open serial port') || msg.includes('Access denied')) {
                msg = 'Port USB sedang dibuka oleh aplikasi lain (misal Arduino IDE, Serial Monitor, atau terminal lain). Tutup aplikasi tersebut lalu coba hubungkan lagi.';
            }
            this.onStatusChange?.('error', msg);
            throw new Error(msg);
        }
    }

    public async disconnect(): Promise<void> {
        this.stopPolling();
        this.isStreamReading = false;

        try {
            if (this.reader) {
                try {
                    await this.reader.cancel();
                } catch {}
            }

            if (this.port) {
                await this.port.close();
                this.port = null;
            }

            this.rxBuffer = [];
            this.onStatusChange?.('disconnected', 'Koneksi serial terputus');
        } catch (err: any) {
            this.onStatusChange?.('error', err?.message || 'Error saat menutup port');
        }
    }

    public isConnected(): boolean {
        return Boolean(this.port && this.isStreamReading);
    }

    public async sendAndReceive(requestFrame: Uint8Array, expectedSlave: number, expectedFunc: number, timeoutMs = 800): Promise<number[]> {
        if (!this.isConnected()) {
            throw new Error('Port serial belum terhubung.');
        }

        while (this.isBusy) {
            await new Promise((r) => setTimeout(r, 20));
        }

        this.isBusy = true;
        this.rxBuffer = [];

        try {
            const writer = this.port.writable.getWriter();
            await writer.write(requestFrame);
            writer.releaseLock();

            const deadline = Date.now() + timeoutMs;
            let responseFound = false;

            while (Date.now() < deadline) {
                if (this.rxBuffer.length >= 5) {
                    const byteCount = this.rxBuffer[2];
                    const expectedTotal = byteCount + 5; // slave + func + byteCount + data + 2 crc
                    if (this.rxBuffer.length >= expectedTotal) {
                        responseFound = true;
                        break;
                    }
                }
                await new Promise((r) => setTimeout(r, 25));
            }

            if (!responseFound || this.rxBuffer.length === 0) {
                throw new Error(`Timeout: Tidak ada respons dari Slave ${expectedSlave}. Pastikan Kabel RS485 A/B tidak terbalik dan Baudrate (${this.currentConfig.baudRate}) / StopBits (${this.currentConfig.stopBits}) sesuai di Autonics.`);
            }

            const responseArray = new Uint8Array(this.rxBuffer);
            return parseModbusResponse(responseArray, expectedSlave, expectedFunc);
        } finally {
            this.isBusy = false;
        }
    }

    public async readMonitoringRegisters(slaveId = 1): Promise<TnDecodedReading> {
        const request = buildReadInputRegisters(slaveId, 1000, 27);
        const registers = await this.sendAndReceive(request, slaveId, 0x04, 1000);
        return decodeAutonicsTnReadings(registers);
    }

    public async writeHoldingRegister(slaveId: number, address: number, value: number): Promise<void> {
        const request = buildWriteSingleRegister(slaveId, address, value);
        await this.sendAndReceive(request, slaveId, 0x06, 1200);
    }

    public startPolling(slaveId = 1, intervalMs = 1000): void {
        if (this.isPolling) return;
        this.isPolling = true;

        const pollStep = async () => {
            if (!this.isPolling || !this.isConnected()) return;

            try {
                const decoded = await this.readMonitoringRegisters(slaveId);
                this.onReading?.(decoded);
            } catch (err: any) {
                this.onError?.(err?.message || 'Gagal membaca data Modbus.');
            }

            if (this.isPolling) {
                this.pollingTimer = setTimeout(pollStep, intervalMs);
            }
        };

        pollStep();
    }

    public stopPolling(): void {
        this.isPolling = false;
        if (this.pollingTimer) {
            clearTimeout(this.pollingTimer);
            this.pollingTimer = null;
        }
    }
}

export const webSerialDriver = new WebSerialModbusDriver();
