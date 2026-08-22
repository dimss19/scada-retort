#!/usr/bin/env python3
"""tn_pin_test.py — Pin/Port test Autonics TN Series (TNS/TNH/TNL) via Modbus RTU + LED box.

Interactive per-kanal: toggle ON 2 detik -> teknisi jawab Y/N -> hasil dicatat ke report.

Usage:
  python tn_pin_test.py --port COM3 --model tnl --slave 1
  python tn_pin_test.py --port COM3 --model tns --slave 1 --dry-run

ponytail: satu file, logika test langsung; dry-run tanpa hardware untuk cek alur.
"""
import argparse
import sys
import time
from pathlib import Path

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
            if self._write_timeout is None:
                pass
            elif self._write_timeout == 0:
                timeouts.WriteTotalTimeoutConstant = _win32.win32.MAXDWORD
            else:
                timeouts.WriteTotalTimeoutConstant = max(int(self._write_timeout * 1000), 1)

            _win32.win32.SetCommTimeouts(self._port_handle, ctypes.byref(timeouts))
            _win32.win32.SetCommMask(self._port_handle, _win32.win32.EV_ERR)
            comDCB = _win32.win32.DCB()
            _win32.win32.GetCommState(self._port_handle, ctypes.byref(comDCB))
            comDCB.BaudRate = self._baudrate
            comDCB.ByteSize = 8
            comDCB.Parity = _win32.win32.NOPARITY
            comDCB.StopBits = _win32.win32.TWOSTOPBITS if self._stopbits == serial.STOPBITS_TWO else _win32.win32.ONESTOPBIT
            comDCB.fBinary = 1
            if not _win32.win32.SetCommState(self._port_handle, ctypes.byref(comDCB)):
                err = ctypes.GetLastError()
                if err != 31:
                    raise serial.SerialException(f'Cannot configure port: Error {err}')

        _win32.Serial._reconfigure_port = _safe_reconfigure_port
    except Exception:
        pass


PINS = {
    "tns": {
        "OUT1": "1-2", "OUT2": "3-4", "AL1": "13-14", "AL2": "15-16",
        "AL3": "-", "AL4": "-", "AL5": "-", "AL6": "-",
    },
    "tnh": {
        "OUT1": "3-4", "OUT2": "5-6", "AL1": "7-8", "AL2": "9-10",
        "AL3": "15-16", "AL4": "17-18", "AL5": "-", "AL6": "-",
    },
    "tnl": {
        "OUT1": "3-4", "OUT2": "5-6", "AL1": "7-8", "AL2": "9-10",
        "AL3": "AL3 (Opt)", "AL4": "AL4 (Opt)", "AL5": "AL5 (Opt)", "AL6": "AL6 (Opt)",
    },
}

# Addresses (data address Modbus, 1-based)
COIL_RUN_STOP = 1
REG_MODE = 400003      # 0=AUTO, 1=MAN
REG_MV_HEAT = 400004   # MV Heater (OUT1)
REG_MV_COOL = 400005   # MV Cooler (OUT2)
REG_ALARM_MODE = 400452      # +8n
REG_ALARM_HIGH = 400454      # +8n
REG_ALARM_CONN = 400459      # +8n
REG_AL_TYPE = 400553         # +5(n-1)
REG_AL_NONC = 400554         # +5(n-1)

# Discrete inputs
DI_OUT1 = 100021
DI_OUT2 = 100022
DI_AL1 = 100027  # AL1..AL6 = 100027..100032

MV_ON = 1000   # 100.0%
MV_OFF = 0
AL_HIGH_TRIP = 100  # batas abs-high di bawah PV ruangan (°C/0.1)


def coil_offset(a):
    return a - 1


def reg_offset(a):
    return a - 400001


def di_offset(a):
    return a - 100001


def channels(model, n_alarm):
    ch = []
    for name, fn in (("OUT1", "Control Output 1 (Heater)"), ("OUT2", "Control Output 2 (Cooler)")):
        if PINS[model][name] != "-":
            ch.append({"name": name, "fn": fn, "pin": PINS[model][name], "kind": "out"})
    for i in range(1, n_alarm + 1):
        key = f"AL{i}"
        if PINS[model].get(key, "-") != "-":
            ch.append({"name": key, "fn": f"Alarm Output {i}", "pin": PINS[model][key], "kind": "alarm", "idx": i})
    return ch


class FakeClient:
    def __init__(self):
        self.state = {}

    def connect(self):
        return True

    def close(self):
        pass

    def write_coil(self, address, value, device_id=None):
        self.state[("c", address)] = bool(value)
        return type("R", (), {"isError": lambda self: False})()

    def write_register(self, address, value, device_id=None):
        self.state[("r", address)] = value
        return type("R", (), {"isError": lambda self: False})()

    def read_discrete_inputs(self, address, count, device_id=None):
        di = {di_offset(DI_OUT1): False, di_offset(DI_OUT2): False}
        di.update({di_offset(DI_AL1) + i - 1: False for i in range(1, 7)})
        if self.state.get(("r", reg_offset(REG_MV_HEAT)), 0) > 0:
            di[di_offset(DI_OUT1)] = True
        if self.state.get(("r", reg_offset(REG_MV_COOL)), 0) > 0:
            di[di_offset(DI_OUT2)] = True
        for i in range(1, 7):
            if self.state.get(("r", reg_offset(REG_ALARM_CONN) + 8 * (i - 1)), 0) == i and self.state.get(("r", reg_offset(REG_ALARM_HIGH) + 8 * (i - 1)), 0) <= AL_HIGH_TRIP:
                di[di_offset(DI_AL1) + i - 1] = True
        return type("R", (), {"isError": lambda self: False, "bits": [di.get(address + i, False) for i in range(count)]})()


def wr(client, fn, address, value=0, device_id=1):
    try:
        resp = fn(address=address, value=value, device_id=device_id)
        return not resp.isError()
    except Exception:
        return False


def rd_di(client, address, count=8, device_id=1):
    try:
        resp = client.read_discrete_inputs(address=address, count=count, device_id=device_id)
        if resp.isError():
            return None
        return resp.bits
    except Exception:
        return None


def toggle_alarm(client, idx, device_id):
    """Konfigurasi Event (idx-1) agar AL.idx trip: abs-high limit < PV ruangan."""
    base = reg_offset(REG_ALARM_MODE) + 8 * (idx - 1)
    return (
        wr(client, client.write_register, base, 0x0005, device_id)      # mode PV[[ (abs high)
        and wr(client, client.write_register, base + 2, AL_HIGH_TRIP, device_id)   # high limit
        and wr(client, client.write_register, base + 7, idx, device_id)            # koneksi ke AL.idx
        and wr(client, client.write_register, reg_offset(REG_AL_TYPE) + 5 * (idx - 1), 0, device_id)   # AL-A
        and wr(client, client.write_register, reg_offset(REG_AL_NONC) + 5 * (idx - 1), 0, device_id)   # NO
    )


def test_channel(client, ch, device_id, on_sec, dry_run, report):
    name, kind = ch["name"], ch["kind"]
    ok = True

    if kind == "out":
        mv_reg = reg_offset(REG_MV_HEAT) if name == "OUT1" else reg_offset(REG_MV_COOL)
        di_reg = di_offset(DI_OUT1) if name == "OUT1" else di_offset(DI_OUT2)
        ok = wr(client, client.write_coil, coil_offset(COIL_RUN_STOP), 0, device_id)      # RUN
        ok = ok and wr(client, client.write_register, reg_offset(REG_MODE), 1, device_id)  # MAN
        ok = ok and wr(client, client.write_register, mv_reg, MV_ON, device_id)
    else:
        ok = toggle_alarm(client, ch["idx"], device_id)

    if not ok:
        report.append((name, ch["pin"], ch["fn"], "COMM FAIL"))
        return

    time.sleep(on_sec if not dry_run else 0)

    di = rd_di(client, di_reg if kind == "out" else di_offset(DI_AL1), 8, device_id)
    di_ok = di is not None and bool(di[ch["idx"] - 1] if kind == "alarm" else di[0])

    if dry_run:
        answer = "Y"
    else:
        sys.stdout.write(f"  LED [{name}] menyala? (Y/n): ")
        sys.stdout.flush()
        answer = input().strip().lower() or "y"

    if answer == "n":
        verdict = "WIRING FAIL" if di_ok else "FAIL"
    elif not di_ok:
        verdict = "COMM FAIL"
    else:
        verdict = "PASS"
    report.append((name, ch["pin"], ch["fn"], verdict))

    if kind == "out":
        wr(client, client.write_register, mv_reg, MV_OFF, device_id)


def main():
    ap = argparse.ArgumentParser(description="Pin/Port test Autonics TN Series via Modbus + LED box")
    ap.add_argument("--port", help="COM port RS485 (mis. COM3)")
    ap.add_argument("--model", choices=["tns", "tnh", "tnl"], required=True, help="Seri TN yang diuji")
    ap.add_argument("--slave", type=int, default=1, help="Address Modbus TN (01-99)")
    ap.add_argument("--baud", type=int, default=9600)
    ap.add_argument("--stopbits", type=float, default=2)
    ap.add_argument("--parity", default="N", choices=["N", "E", "O"])
    ap.add_argument("--n-alarm", type=int, default=6, help="Jumlah alarm model (2/4/6)")
    ap.add_argument("--on-sec", type=float, default=2.0, help="Durasi LED menyala per kanal")
    ap.add_argument("--report", default="tn_pin_test_report.md")
    ap.add_argument("--dry-run", action="store_true", help="Simulasi tanpa hardware")
    args = ap.parse_args()

    if args.dry_run or args.port is None:
        client = FakeClient()
        if args.dry_run:
            print("!! DRY-RUN — tanpa hardware, hanya simulasi alur")
    else:
        try:
            from pymodbus.client import ModbusSerialClient
        except ImportError:
            sys.exit("pymodbus belum terinstall: pip install -r scripts/requirements.txt")
        client = ModbusSerialClient(
            port=args.port, baudrate=args.baud, parity=args.parity,
            stopbits=args.stopbits, timeout=2,
        )
        if not client.connect():
            sys.exit(f"Gagal konek ke {args.port}")

    chs = channels(args.model, args.n_alarm)
    print(f"Model: {args.model.upper()} | Slave: {args.slave} | Kanal: {len(chs)}")
    report = []
    try:
        for ch in chs:
            print(f"\n[{ch['name']}] {ch['fn']} (terminal {ch['pin']})")
            test_channel(client, ch, args.slave, args.on_sec, args.dry_run, report)
        if not args.dry_run:
            wr(client, client.write_coil, coil_offset(COIL_RUN_STOP), 1, args.slave)  # kembalikan STOP
    except KeyboardInterrupt:
        print("\nTest dibatalkan user")
        if not args.dry_run:
            wr(client, client.write_coil, coil_offset(COIL_RUN_STOP), 1, args.slave)
    finally:
        if not args.dry_run:
            client.close()

    Path(args.report).write_text(
        "# TN Pin/Port Test Report\n\n"
        f"- Model: {args.model.upper()}, Slave: {args.slave}, Waktu: {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        "| Kanal | Terminal | Fungsi | Hasil |\n|---|---|---|---|\n"
        + "\n".join(f"| {n} | {p} | {f} | {v} |" for n, p, f, v in report)
        + f"\n\n**Ringkasan:** {sum(1 for r in report if r[3]=='PASS')}/{len(report)} PASS\n",
        encoding="utf-8",
    )
    print(f"\nLaporan tersimpan: {args.report}")


if __name__ == "__main__":
    main()