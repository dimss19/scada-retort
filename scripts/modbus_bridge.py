import argparse
import json
import sys
from pymodbus.client import ModbusSerialClient
from pymodbus.exceptions import ModbusException
import serial.tools.list_ports
def setup_client(args):
    parity_map = {'N': 'N', 'E': 'E', 'O': 'O'}
    return ModbusSerialClient(
        port=args.port,
        baudrate=args.baud,
        parity=parity_map.get(args.parity, 'N'),
        stopbits=args.stopbits,
        timeout=args.timeout
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

def scan_ports(client, args):
    ports = serial.tools.list_ports.comports()
    for port in ports:
        args.port = port.device
        test_client = setup_client(args)
        if test_client.connect():
            try:
                response = test_client.read_input_registers(address=1000, count=1, device_id=args.slave)
                if not response.isError():
                    test_client.close()
                    return {"success": True, "port": port.device}
            except Exception:
                pass
            test_client.close()
    return {"success": False, "error": "No working Modbus port found"}

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
    
    # scan_ports
    p_sp = subparsers.add_parser("scan_ports")
    p_sp.add_argument("--slave", type=int, required=True)

    args = parser.parse_args()
    
    # pymodbus expects bool for write_coil value
    if args.command == 'write_coil':
        args.value = bool(args.value)

    if args.command == 'scan_ports':
        result = scan_ports(None, args)
        print(json.dumps(result))
        sys.exit(0)

    if not args.port:
        print(json.dumps({"success": False, "error": "--port is required for this command"}))
        sys.exit(1)

    client = setup_client(args)
    if not client.connect():
        print(json.dumps({"success": False, "error": f"Could not connect to {args.port}"}))
        sys.exit(1)
        
    handlers = {
        "read_input": read_input,
        "read_holding": read_holding,
        "read_coil": read_coil,
        "read_discrete": read_discrete,
        "write_register": write_register,
        "write_coil": write_coil,
        "write_registers": write_registers,
        "test_connection": test_connection
    }
    
    result = handlers[args.command](client, args)
    client.close()
    
    print(json.dumps(result))

if __name__ == "__main__":
    main()
