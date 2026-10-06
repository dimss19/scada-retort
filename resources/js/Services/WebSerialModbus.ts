/**
 * WebSerialModbus.ts
 * Client-side Modbus RTU Driver using Web Serial API (navigator.serial)
 * Enables direct RS485 communication with Autonics TN series controllers from the browser on the user's laptop.
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
 * Builds Modbus RTU Write Single Coil (Function 0x05) request
 */
export function buildWriteSingleCoil(slaveId: number, address: number, state: boolean): Uint8Array {
    const frame = new Uint8Array(8);
    frame[0] = slaveId;
    frame[1] = 0x05; // Function 0x05
    frame[2] = (address >> 8) & 0xFF;
    frame[3] = address & 0xFF;
    frame[4] = state ? 0xFF : 0x00;
    frame[5] = 0x00;

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

    // For write single register (0x06) or write single coil (0x05), the slave echoes back 8 bytes
    if (expectedFunc === 0x05 || expectedFunc === 0x06) {
        return [];
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
    private isPolling = false;
    private pollingTimer: any = null;
    private isBusy = false;
    private keepReading = false;
    private rxBuffer: number[] = [];
    private dataWaiters: Array<() => void> = [];
    private activeSlaveId = 1;
    private consecutiveErrors = 0;

    public onReading?: (reading: TnDecodedReading) => void;
    public onStatusChange?: (status: 'disconnected' | 'connecting' | 'connected' | 'error', message?: string, portInfo?: any) => void;
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
            throw new Error('Web Serial API tidak didukung di browser ini. Gunakan Google Chrome atau Microsoft Edge di laptop Anda.');
        }
        return await (navigator as any).serial.requestPort();
    }

    /**
     * Starts continuous background stream reader loop
     * This avoids any Web Streams locking or reader.read() race conditions
     */
    private async startReaderLoop(): Promise<void> {
        this.keepReading = true;
        while (this.port?.readable && this.keepReading) {
            try {
                this.reader = this.port.readable.getReader();
                while (this.keepReading) {
                    const { value, done } = await this.reader.read();
                    if (done) break;
                    if (value && value.length > 0) {
                        for (let i = 0; i < value.length; i++) {
                            this.rxBuffer.push(value[i]);
                        }
                        // Notify all awaiting callers
                        const waiters = [...this.dataWaiters];
                        this.dataWaiters = [];
                        for (const notify of waiters) {
                            notify();
                        }
                    }
                }
            } catch (err: any) {
                if (!this.keepReading) break;
                console.warn('Web Serial stream read warning:', err);
                await new Promise((r) => setTimeout(r, 100));
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

    /**
     * Connect to the selected or requested serial port
     */
    public async connect(selectedPort?: any, config: ModbusPortConfig = { baudRate: 9600, stopBits: 2 }): Promise<any> {
        this.onStatusChange?.('connecting', 'Membuka koneksi port serial laptop...');

        try {
            if (!this.port) {
                this.port = selectedPort || (await this.requestPort());
            }

            if (!this.port) {
                throw new Error('Tidak ada port serial yang dipilih.');
            }

            const info = typeof this.port.getInfo === 'function' ? this.port.getInfo() : {};

            // Autonics TN default: 9600 baud, 8 data bits, 2 stop bits when Parity is None
            const stopBits = config.stopBits ?? 2;
            const parity = config.parity ?? 'none';
            const baudRate = config.baudRate || 9600;

            await this.port.open({
                baudRate,
                dataBits: config.dataBits || 8,
                stopBits,
                parity,
                bufferSize: 2048,
            });

            // Assert DTR and RTS signals (required by some USB-RS485 converters to enable transceiver)
            try {
                await this.port.setSignals({ dataTerminalReady: true, requestToSend: true });
            } catch (sigErr) {
                console.warn('Could not set serial signals:', sigErr);
            }

            // Start continuous reader loop
            this.startReaderLoop();

            this.onStatusChange?.('connected', `Terhubung ke USB Serial (${baudRate} bps, 8-${parity[0].toUpperCase()}-${stopBits})`, info);
            return this.port;
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
        this.keepReading = false;

        try {
            if (this.reader) {
                try {
                    await this.reader.cancel();
                } catch {}
                try {
                    this.reader.releaseLock();
                } catch {}
                this.reader = null;
            }

            if (this.port) {
                await this.port.close();
                this.port = null;
            }

            this.rxBuffer = [];
            this.dataWaiters = [];
            this.onStatusChange?.('disconnected', 'Koneksi serial laptop terputus');
        } catch (err: any) {
            this.onStatusChange?.('error', err?.message || 'Error saat menutup port');
        }
    }

    public isConnected(): boolean {
        return Boolean(this.port && this.port.readable && this.port.writable);
    }

    /**
     * Sends a raw Modbus RTU frame and awaits response via persistent stream reader
     */
    public async sendAndReceive(requestFrame: Uint8Array, expectedSlave: number, expectedFunc: number, timeoutMs = 1200): Promise<number[]> {
        if (!this.isConnected()) {
            throw new Error('Port serial belum terhubung.');
        }

        while (this.isBusy) {
            await new Promise((r) => setTimeout(r, 15));
        }

        this.isBusy = true;

        try {
            // Discard any residual noise in RX buffer before sending
            this.rxBuffer = [];

            // Transmit request frame
            const writer = this.port.writable.getWriter();
            try {
                await writer.write(requestFrame);
            } finally {
                writer.releaseLock();
            }

            // Wait for full Modbus response from background reader
            const startTime = Date.now();
            while (Date.now() - startTime < timeoutMs) {
                if (this.rxBuffer.length >= 5) {
                    // Check for Modbus Exception Response (0x80 | function)
                    if (this.rxBuffer[1] === (expectedFunc | 0x80)) {
                        if (this.rxBuffer.length >= 5) {
                            const errFrame = new Uint8Array(this.rxBuffer.slice(0, 5));
                            return parseModbusResponse(errFrame, expectedSlave, expectedFunc);
                        }
                    }

                    // Check for Function 0x03 or 0x04 response
                    if (expectedFunc === 0x03 || expectedFunc === 0x04) {
                        const byteCount = this.rxBuffer[2];
                        const expectedTotal = byteCount + 5;
                        if (this.rxBuffer.length >= expectedTotal) {
                            const responseFrame = new Uint8Array(this.rxBuffer.slice(0, expectedTotal));
                            return parseModbusResponse(responseFrame, expectedSlave, expectedFunc);
                        }
                    } else if (expectedFunc === 0x05 || expectedFunc === 0x06) {
                        // Echo response is 8 bytes
                        if (this.rxBuffer.length >= 8) {
                            const responseFrame = new Uint8Array(this.rxBuffer.slice(0, 8));
                            return parseModbusResponse(responseFrame, expectedSlave, expectedFunc);
                        }
                    }
                }

                // Wait for next incoming bytes or 35ms interval
                await new Promise<void>((resolve) => {
                    const timer = setTimeout(resolve, 35);
                    this.dataWaiters.push(() => {
                        clearTimeout(timer);
                        resolve();
                    });
                });
            }

            throw new Error(`Timeout: Controller tidak merespons (Slave ID: ${expectedSlave}). Pastikan kabel RS-485 (A & B) terhubung benar dan Slave ID sesuai.`);
        } finally {
            this.isBusy = false;
        }
    }

    /**
     * Reads standard monitoring registers (1000..1026) from Autonics TN controller
     * Tries Read Input Registers (0x04) first, then falls back to Read Holding Registers (0x03)
     */
    public async readMonitoringRegisters(slaveId = 1): Promise<TnDecodedReading> {
        try {
            const request = buildReadInputRegisters(slaveId, 1000, 27);
            const registers = await this.sendAndReceive(request, slaveId, 0x04, 1000);
            return decodeAutonicsTnReadings(registers);
        } catch (err: any) {
            // If exception or unhandled, fallback to Function 0x03 (Holding Registers)
            if (err?.message?.includes('Modbus Exception') || err?.message?.includes('Function code mismatch')) {
                const holdingRequest = buildReadHoldingRegisters(slaveId, 1000, 27);
                const holdingRegs = await this.sendAndReceive(holdingRequest, slaveId, 0x03, 1000);
                return decodeAutonicsTnReadings(holdingRegs);
            }
            throw err;
        }
    }

    /**
     * Writes single holding register (e.g. Set SV)
     */
    public async writeHoldingRegister(slaveId: number, address: number, value: number): Promise<void> {
        const request = buildWriteSingleRegister(slaveId, address, value);
        await this.sendAndReceive(request, slaveId, 0x06, 1200);
    }

    /**
     * Writes single coil (e.g. RUN/STOP command)
     */
    public async writeSingleCoil(slaveId: number, address: number, state: boolean): Promise<void> {
        const request = buildWriteSingleCoil(slaveId, address, state);
        await this.sendAndReceive(request, slaveId, 0x05, 1200);
    }

    /**
     * Starts continuous background polling loop with automatic Slave ID resolution
     */
    public startPolling(initialSlaveId = 1, intervalMs = 1000): void {
        if (this.isPolling) return;
        this.isPolling = true;
        this.activeSlaveId = initialSlaveId;
        this.consecutiveErrors = 0;

        const candidateSlaves = [initialSlaveId, 1, 2, 3, 4].filter((v, idx, arr) => arr.indexOf(v) === idx);

        const pollStep = async () => {
            if (!this.isPolling || !this.isConnected()) return;

            try {
                const decoded = await this.readMonitoringRegisters(this.activeSlaveId);
                this.consecutiveErrors = 0;
                this.onReading?.(decoded);
            } catch (err: any) {
                this.consecutiveErrors++;
                
                // If 3 consecutive failures occur, attempt probing other common Slave IDs (1, 2, 3, 4)
                if (this.consecutiveErrors >= 3 && candidateSlaves.length > 1) {
                    const nextSlave = candidateSlaves[this.consecutiveErrors % candidateSlaves.length];
                    try {
                        const probeDecoded = await this.readMonitoringRegisters(nextSlave);
                        // If probe succeeded, latch onto this active slave ID!
                        this.activeSlaveId = nextSlave;
                        this.consecutiveErrors = 0;
                        this.onReading?.(probeDecoded);
                        return;
                    } catch {}
                }

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
