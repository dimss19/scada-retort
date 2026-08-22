import argparse
import json
import sys
from pymodbus.client import ModbusSerialClient
from pymodbus.exceptions import ModbusException
import serial.tools.list_ports
import re

import os
if os.name == 'nt':
    try:
        import ctypes
        import serial
        import serial.serialwin32 as _win32
        _orig_reconfigure = _win32.Serial._reconfigure_port

        def _safe_reconfigure_port(self):
            if not self._port_handle:
                raise serial.SerialException('Can only operate on a valid port handle')

            timeouts = _win32.win32.COMMTIMEOUTS()
            if self._timeout is None:
                pass
            elif self._timeout == 0:
                timeouts.ReadIntervalTimeout = _win32.win32.MAXDWORD
            else:
                timeouts.ReadTotalTimeoutConstant = max(int(self._timeout * 1000), 1)
            if self._timeout != 0 and self._inter_byte_timeout is not None:
                timeouts.ReadIntervalTimeout = max(int(self._inter_byte_timeout * 1000), 1)

            timeouts.WriteTotalTimeoutConstant = 2000
            timeouts.WriteTotalTimeoutMultiplier = 0

            _win32.win32.SetCommTimeouts(self._port_handle, ctypes.byref(timeouts))
            _win32.win32.SetCommMask(self._port_handle, _win32.win32.EV_ERR)

            comDCB = _win32.win32.DCB()
            _win32.win32.GetCommState(self._port_handle, ctypes.byref(comDCB))
            comDCB.BaudRate = self._baudrate
            comDCB.ByteSize = 8
            comDCB.Parity = _win32.win32.NOPARITY
            comDCB.StopBits = _win32.win32.TWOSTOPBITS if self._stopbits == serial.STOPBITS_TWO else _win32.win32.ONESTOPBIT
            comDCB.fBinary = 1
            
            # Try SetCommState, ignore Error 31 (Windows CH340 driver bug)
            if not _win32.win32.SetCommState(self._port_handle, ctypes.byref(comDCB)):
                err = ctypes.GetLastError()
                if err != 31:
                    raise serial.SerialException(f'Cannot configure port: Error {err}')

        _win32.Serial._reconfigure_port = _safe_reconfigure_port
    except Exception:
        pass

def setup_client(args):
    parity_map = {'N': 'N', 'E': 'E', 'O': 'O'}
    return ModbusSerialClient(
        port=args.port,
        baudrate=args.baud,
        parity=parity_map.get(args.parity, 'N'),
        stopbits=args.stopbits,
        timeout=args.timeout,
        retries=1
    )

def handle_response(response, count=None):
    if response.isError():
        return {"success": False, "error": f"Modbus Exception: {response}"}
    
    if hasattr(response, 'registers'):
        data = response.registers
        if count and len(data) != count:
            return {"success": False, "error": f"Expected {count} registers, got {len(data)}"}
        return {"success": True, "data": data}
        
    if hasattr(response, 'bits'):
        data = response.bits[:count] if count else response.bits
        return {"success": True, "data": data}
        
    return {"success": True, "data": "Operation successful"}

def read_input(client, args):
    try:
        response = client.read_input_registers(address=args.addr, count=args.count, device_id=args.slave)
        return handle_response(response, args.count)
    except Exception as e:
        return {"success": False, "error": str(e)}

import traceback

def read_holding(client, args):
    try:
        response = client.read_holding_registers(address=args.addr, count=args.count, device_id=args.slave)
        return handle_response(response, args.count)
    except Exception as e:
        return {"success": False, "error": str(e) + " Traceback: " + traceback.format_exc()}

def read_coil(client, args):
    try:
        response = client.read_coils(address=args.addr, count=args.count, device_id=args.slave)
        return handle_response(response, args.count)
    except Exception as e:
        return {"success": False, "error": str(e)}

def read_discrete(client, args):
    try:
        response = client.read_discrete_inputs(address=args.addr, count=args.count, device_id=args.slave)
        return handle_response(response, args.count)
    except Exception as e:
        return {"success": False, "error": str(e)}

def write_register(client, args):
    try:
        response = client.write_register(address=args.addr, value=args.value, device_id=args.slave)
        return handle_response(response)
    except Exception as e:
        return {"success": False, "error": str(e)}

def write_coil(client, args):
    try:
        response = client.write_coil(address=args.addr, value=args.value, device_id=args.slave)
        return handle_response(response)
    except Exception as e:
        return {"success": False, "error": str(e)}

def write_registers(client, args):
    try:
        values = [int(v) for v in args.values.split(',')]
        response = client.write_registers(address=args.addr, values=values, device_id=args.slave)
        return handle_response(response)
    except Exception as e:
        return {"success": False, "error": str(e)}
        
def test_connection(client, args):
    try:
        # PV is usually at input register 1000 (301001)
        response = client.read_input_registers(address=1000, count=1, device_id=args.slave)
        return handle_response(response, 1)
    except Exception as e:
        return {"success": False, "error": str(e)}

def toggle_pin(client, args):
    import time
    try:
        channel = args.channel.upper()
        slave = args.slave
        # Set RUN to allow MV manipulation
        client.write_register(address=0, value=0, device_id=slave)

        if channel in ["OUT1", "OUT2"]:
            mv_reg = 3 if channel == "OUT1" else 4
            # Mode manual
            client.write_register(address=2, value=1, device_id=slave)
            # Set 100% MV
            client.write_register(address=mv_reg, value=1000, device_id=slave)
            time.sleep(2)
            # Reset MV & set Auto mode
            client.write_register(address=mv_reg, value=0, device_id=slave)
            client.write_register(address=2, value=0, device_id=slave)
            return {"success": True, "message": f"{channel} berhasil di-trigger aktif selama 2 detik."}
        elif channel.startswith("AL"):
            idx = int(channel.replace("AL", ""))
            base = 451 + 8 * (idx - 1)  # REG_ALARM_MODE offset
            client.write_register(address=base, value=0x0005, device_id=slave)
            client.write_register(address=base + 2, value=100, device_id=slave) # Absolute high
            client.write_register(address=base + 7, value=idx, device_id=slave)
            time.sleep(2)
            # Reset alarm config
            client.write_register(address=base, value=0, device_id=slave)
            return {"success": True, "message": f"{channel} (Alarm {idx}) berhasil di-trigger aktif selama 2 detik."}
        else:
            return {"success": False, "error": f"Kanal {channel} tidak dikenal"}
    except Exception as e:
        return {"success": False, "error": f"Gagal trigger {args.channel}: {str(e)}"}

def list_ports(args):
    ports = []
    for p in serial.tools.list_ports.comports():
        ports.append({
            "device": p.device,
            "description": p.description,
            "hwid": p.hwid,
            "vid": p.vid,
            "pid": p.pid,
            "serial_number": p.serial_number,
            "manufacturer": p.manufacturer,
        })
    ports.sort(key=lambda x: x["device"].lower())
    return {"success": True, "ports": ports}

def scan_ports(client, args):
    def port_sort_key(port):
        match = re.search(r'(\d+)$', port.device)
        return (port.device.rstrip('0123456789'), int(match.group(1)) if match else 0)

    ports = sorted(serial.tools.list_ports.comports(), key=port_sort_key)
    found = []
    for port in ports:
        args.port = port.device
        test_client = setup_client(args)
        if test_client.connect():
            try:
                response = test_client.read_input_registers(address=1000, count=1, device_id=args.slave)
                if not response.isError():
                    return {"success": True, "port": port.device}
            except Exception:
                pass
            finally:
                test_client.close()
    return {"success": False, "error": "No working Modbus port found", "ports_tried": [p.device for p in ports]}

def read_all(client, args):
    slaves = [int(s.strip()) for s in args.slaves.split(',') if s.strip()]
    results = {}
    for slave_id in slaves:
        try:
            response = client.read_input_registers(address=args.addr, count=args.count, device_id=slave_id)
            if response.isError():
                results[slave_id] = {"success": False, "error": f"Modbus Exception: {response}"}
            else:
                results[slave_id] = {"success": True, "data": response.registers}
        except Exception as e:
            results[slave_id] = {"success": False, "error": str(e)}
    return {"success": True, "controllers": results}

def main():
    parser = argparse.ArgumentParser(description="Modbus Bridge for Laravel")
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    # Common arguments
    parser.add_argument("--port", required=False, help="Serial port (e.g., COM3, /dev/ttyUSB0)")
    parser.add_argument("--baud", type=int, default=9600, help="Baudrate")
    parser.add_argument("--parity", default="N", help="Parity (N, E, O)")
    parser.add_argument("--stopbits", type=int, default=2, help="Stop bits")
    parser.add_argument("--timeout", type=float, default=1.0, help="Timeout in seconds")
    
    # read_input
    p_ri = subparsers.add_parser("read_input")
    p_ri.add_argument("--slave", type=int, required=True)
    p_ri.add_argument("--addr", type=int, required=True)
    p_ri.add_argument("--count", type=int, required=True)
    
    # read_holding
    p_rh = subparsers.add_parser("read_holding")
    p_rh.add_argument("--slave", type=int, required=True)
    p_rh.add_argument("--addr", type=int, required=True)
    p_rh.add_argument("--count", type=int, required=True)
    
    # read_coil
    p_rc = subparsers.add_parser("read_coil")
    p_rc.add_argument("--slave", type=int, required=True)
    p_rc.add_argument("--addr", type=int, required=True)
    p_rc.add_argument("--count", type=int, required=True)
    
    # read_discrete
    p_rd = subparsers.add_parser("read_discrete")
    p_rd.add_argument("--slave", type=int, required=True)
    p_rd.add_argument("--addr", type=int, required=True)
    p_rd.add_argument("--count", type=int, required=True)
    
    # write_register
    p_wr = subparsers.add_parser("write_register")
    p_wr.add_argument("--slave", type=int, required=True)
    p_wr.add_argument("--addr", type=int, required=True)
    p_wr.add_argument("--value", type=int, required=True)
    
    # write_coil
    p_wc = subparsers.add_parser("write_coil")
    p_wc.add_argument("--slave", type=int, required=True)
    p_wc.add_argument("--addr", type=int, required=True)
    p_wc.add_argument("--value", type=int, required=True) # Usually 0xFF00 (True) or 0x0000 (False) for coils, pymodbus handles bools, so 0 or 1
    
    # write_registers
    p_wrs = subparsers.add_parser("write_registers")
    p_wrs.add_argument("--slave", type=int, required=True)
    p_wrs.add_argument("--addr", type=int, required=True)
    p_wrs.add_argument("--values", required=True, help="Comma-separated values")
    
    # test_connection
    p_tc = subparsers.add_parser("test_connection")
    p_tc.add_argument("--slave", type=int, required=True)
    
    # toggle_pin
    p_tp = subparsers.add_parser("toggle_pin")
    p_tp.add_argument("--slave", type=int, required=True)
    p_tp.add_argument("--channel", required=True, help="Channel name e.g. OUT1, OUT2, AL1..AL6")
    
    # list_ports
    subparsers.add_parser("list_ports")

    # scan_ports
    p_sp = subparsers.add_parser("scan_ports")
    p_sp.add_argument("--slave", type=int, required=True)

    # read_all - batch read all controllers in one connection
    p_ra = subparsers.add_parser("read_all")
    p_ra.add_argument("--slaves", required=True, help="Comma-separated slave IDs")
    p_ra.add_argument("--addr", type=int, default=1000, help="Start address")
    p_ra.add_argument("--count", type=int, default=27, help="Register count")

    args = parser.parse_args()
    
    # pymodbus expects bool for write_coil value
    if args.command == 'write_coil':
        args.value = bool(args.value)

    if args.command == 'list_ports':
        result = list_ports(args)
        print(json.dumps(result))
        sys.exit(0)

    if args.command == 'scan_ports':
        result = scan_ports(None, args)
        print(json.dumps(result))
        sys.exit(0)

    if args.command == 'read_all':
        if not args.port:
            print(json.dumps({"success": False, "error": "--port is required for read_all"}))
            sys.exit(0)
        client = setup_client(args)
        if not client.connect():
            print(json.dumps({"success": False, "error": f"Could not connect to {args.port}"}))
            sys.exit(0)
        result = read_all(client, args)
        client.close()
        print(json.dumps(result))
        sys.exit(0)

    if not args.port:
        print(json.dumps({"success": False, "error": "--port is required for this command"}))
        sys.exit(0)

    client = setup_client(args)
    if not client.connect():
        print(json.dumps({"success": False, "error": f"Could not connect to {args.port}"}))
        sys.exit(0)
        
    handlers = {
        "read_input": read_input,
        "read_holding": read_holding,
        "read_coil": read_coil,
        "read_discrete": read_discrete,
        "write_register": write_register,
        "write_coil": write_coil,
        "write_registers": write_registers,
        "test_connection": test_connection,
        "toggle_pin": toggle_pin
    }
    
    result = handlers[args.command](client, args)
    client.close()
    
    print(json.dumps(result))

if __name__ == "__main__":
    main()
