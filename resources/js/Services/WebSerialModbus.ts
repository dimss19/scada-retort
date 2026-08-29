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
        // Convert to signed 16-bit int if needed
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
    private writer: any = null;
    private isPolling = false;
    private pollingTimer: any = null;
    private isBusy = false;

    public onReading?: (reading: TnDecodedReading) => void;
    public onStatusChange?: (status: 'disconnected' | 'connecting' | 'connected' | 'error', message?: string) => void;
    public onError?: (error: string) => void;

    /**
     * Checks if the Web Serial API is supported in current browser environment
     */
    public static isSupported(): boolean {
        return typeof navigator !== 'undefined' && 'serial' in navigator;
    }

    /**
     * Request user to pick a serial port through Chrome native dialog
     */
    public async requestPort(): Promise<any> {
        if (!WebSerialModbusDriver.isSupported()) {
            throw new Error('Web Serial API tidak didukung di browser ini. Gunakan Google Chrome atau Microsoft Edge.');
        }
        return await (navigator as any).serial.requestPort();
    }

    /**
     * Connect to the selected or provided serial port
     */
    public async connect(selectedPort?: any, config: ModbusPortConfig = { baudRate: 9600 }): Promise<void> {
        this.onStatusChange?.('connecting', 'Membuka koneksi serial...');

        try {
            if (!this.port) {
                this.port = selectedPort || (await this.requestPort());
            }

            if (!this.port) {
                throw new Error('Tidak ada port serial yang dipilih.');
            }

            // Open port with 9600 baud, 8 data bits, 1 stop bit, no parity (Autonics default)
            await this.port.open({
                baudRate: config.baudRate || 9600,
                dataBits: config.dataBits || 8,
                stopBits: config.stopBits || 1,
                parity: config.parity || 'none',
                bufferSize: 1024,
            });

            this.onStatusChange?.('connected', `Terhubung ke USB Serial (${config.baudRate || 9600} bps)`);
        } catch (err: any) {
            this.port = null;
            const msg = err?.message || 'Gagal membuka port serial.';
            this.onStatusChange?.('error', msg);
            throw err;
        }
    }

    /**
     * Disconnect and release port streams
     */
    public async disconnect(): Promise<void> {
        this.stopPolling();

        try {
            if (this.reader) {
                try {
                    await this.reader.cancel();
                } catch {}
                this.reader.releaseLock();
                this.reader = null;
            }

            if (this.writer) {
                this.writer.releaseLock();
                this.writer = null;
            }

            if (this.port) {
                await this.port.close();
                this.port = null;
            }

            this.onStatusChange?.('disconnected', 'Koneksi serial terputus');
        } catch (err: any) {
            this.onStatusChange?.('error', err?.message || 'Error saat menutup port');
        }
    }

    public isConnected(): boolean {
        return Boolean(this.port && this.port.readable && this.port.writable);
    }

    /**
     * Sends a raw Modbus RTU frame and awaits response
     */
    public async sendAndReceive(requestFrame: Uint8Array, expectedSlave: number, expectedFunc: number, timeoutMs = 800): Promise<number[]> {
        if (!this.isConnected()) {
            throw new Error('Port serial belum terhubung.');
        }

        while (this.isBusy) {
            await new Promise((r) => setTimeout(r, 20));
        }

        this.isBusy = true;

        try {
            const writer = this.port.writable.getWriter();
            await writer.write(requestFrame);
            writer.releaseLock();

            // Read response bytes with timeout
            const reader = this.port.readable.getReader();
            const chunks: number[] = [];
            const startTime = Date.now();

            try {
                while (Date.now() - startTime < timeoutMs) {
                    // Read with short chunk polling
                    const { value, done } = await Promise.race([
                        reader.read(),
                        new Promise<{ value: undefined; done: boolean }>((res) =>
                            setTimeout(() => res({ value: undefined, done: false }), 200)
                        ),
                    ]);

                    if (done) break;

                    if (value) {
                        for (let i = 0; i < value.length; i++) {
                            chunks.push(value[i]);
                        }

                        // Check if we received enough bytes
                        if (chunks.length >= 5) {
                            const expectedBytes = chunks[2] + 5; // slave + func + count + data + 2 crc
                            if (chunks.length >= expectedBytes) {
                                break;
                            }
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }

            if (chunks.length === 0) {
                throw new Error('No response from controller (Timeout). Cek kabel RS485 A/B dan Slave ID.');
            }

            const responseArray = new Uint8Array(chunks);
            return parseModbusResponse(responseArray, expectedSlave, expectedFunc);
        } finally {
            this.isBusy = false;
        }
    }

    /**
     * Reads standard monitoring registers (1000..1026) from Autonics TN controller
     */
    public async readMonitoringRegisters(slaveId = 1): Promise<TnDecodedReading> {
        const request = buildReadInputRegisters(slaveId, 1000, 27);
        const registers = await this.sendAndReceive(request, slaveId, 0x04, 1000);
        return decodeAutonicsTnReadings(registers);
    }

    /**
     * Writes single holding register (e.g. Set SV or RUN/STOP)
     */
    public async writeHoldingRegister(slaveId: number, address: number, value: number): Promise<void> {
        const request = buildWriteSingleRegister(slaveId, address, value);
        await this.sendAndReceive(request, slaveId, 0x06, 1200);
    }

    /**
     * Starts continuous background polling loop
     */
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

    /**
     * Stops polling loop
     */
    public stopPolling(): void {
        this.isPolling = false;
        if (this.pollingTimer) {
            clearTimeout(this.pollingTimer);
            this.pollingTimer = null;
        }
    }
}

// Singleton global driver instance
export const webSerialDriver = new WebSerialModbusDriver();
