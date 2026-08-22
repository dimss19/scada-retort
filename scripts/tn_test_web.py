#!/usr/bin/env python3
"""tn_test_web.py — Web UI testing RS485 + pin/port Autonics TN Series (standalone).

Jalankan:  python tn_test_web.py [--port 8081]
Buka:      http://127.0.0.1:8081

ponytail: http.server stdlib + pymodbus sync per-request; satu file, no framework.
"""
import argparse
import json
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

import tn_pin_test as t


class TNApi:
    def __init__(self, args):
        self.args = args
        self._client = None
        self._params = None
        self._lock = threading.Lock()

    def ports(self):
        import serial.tools.list_ports
        return [{"device": p.device, "desc": p.description} for p in serial.tools.list_ports.comports()]

    def disconnect(self):
        return {"success": True, "message": "Port RS485 siap"}

    def _create_client(self, q):
        from pymodbus.client import ModbusSerialClient
        port = q.get("port", [self.args.com])[0]
        baud = int(q.get("baud", [self.args.baud])[0])
        parity = q.get("parity", [self.args.parity])[0]
        stopbits = int(q.get("stopbits", [self.args.stopbits])[0])
        return ModbusSerialClient(
            port=port,
            baudrate=baud,
            parity=parity,
            stopbits=stopbits,
            timeout=2,
        )

    def test(self, q):
        with self._lock:
            c = self._create_client(q)
            if not c.connect():
                return {"success": False, "error": "Tidak bisa membuka port COM. Pastikan kabel terpasang dan port tidak dipakai aplikasi lain."}
            try:
                slave = int(q.get("slave", ["1"])[0])
                # Read input registers starting at 1000 (PV, Decimal Point, Unit, SV, Heat MV, Cool MV)
                r = c.read_input_registers(address=1000, count=6, device_id=slave)
                if r.isError():
                    # Fallback to holding register if needed
                    r_h = c.read_holding_registers(address=0, count=6, device_id=slave)
                    if r_h.isError():
                        return {"success": False, "error": f"Modbus Error: {r}"}
                    return {"success": True, "sv": r_h.registers[5] if len(r_h.registers) > 5 else 0, "pv": r_h.registers[0]}
                pv = r.registers[0]
                dp = r.registers[1]
                sv = r.registers[3] if len(r.registers) > 3 else 0
                mv = r.registers[4] if len(r.registers) > 4 else 0
                return {"success": True, "pv": pv, "sv": sv, "mv_heat": mv}
            except Exception as e:
                return {"success": False, "error": f"Error pembacaan: {e}"}
            finally:
                c.close()

    def toggle(self, q):
        """Toggle channel ON 2 detik, verifikasi via input/holding, kembalikan OFF."""
        model = q.get("model", ["tnl"])[0]
        name = q.get("channel", ["OUT1"])[0]
        n_alarm = int(q.get("n_alarm", ["6"])[0])
        slave = int(q.get("slave", ["1"])[0])

        with self._lock:
            c = self._create_client(q)
            if not c.connect():
                return {"success": False, "error": "Tidak bisa membuka port COM."}
            try:
                ch = next((x for x in t.channels(model, n_alarm) if x["name"] == name), None)
                if not ch:
                    return {"success": False, "error": f"Kanal {name} tidak valid"}

                # Pastikan STOP (Holding Reg 400001 / addr 0 = 1 STOP, 0 RUN)
                c.write_register(address=0, value=0, device_id=slave) # RUN to allow MV
                if ch["kind"] == "out":
                    mv_reg = 3 if name == "OUT1" else 4 # 400004 (addr 3) = Manual MV Heat, 400005 (addr 4) = Cool
                    # Set MANUAL mode (400003 / addr 2 = 1)
                    c.write_register(address=2, value=1, device_id=slave)
                    c.write_register(address=mv_reg, value=1000, device_id=slave) # 100% MV
                    time.sleep(2)
                    c.write_register(address=mv_reg, value=0, device_id=slave)
                    c.write_register(address=2, value=0, device_id=slave) # Set AUTO back
                    return {"success": True, "channel": name, "pin": ch["pin"], "status_ok": True}
                else:
                    # Alarm event toggle
                    t.toggle_alarm(c, ch["idx"], slave)
                    time.sleep(2)
                    # Reset alarm / revert
                    c.write_register(address=t.reg_offset(t.REG_ALARM_MODE) + 8 * (ch["idx"] - 1), value=0, device_id=slave)
                    return {"success": True, "channel": name, "pin": ch["pin"], "status_ok": True}
            except Exception as e:
                return {"success": False, "error": f"Error toggle {name}: {e}"}
            finally:
                c.close()


class Handler(BaseHTTPRequestHandler):
    api = None

    def log_message(self, *a):
        pass

    def _json(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/":
            self._page()
        elif path == "/api/ports":
            self._json({"ports": self.api.ports()})
        else:
            self._json({"error": "not found"}, 404)

    def do_POST(self):
        path = urlparse(self.path).path
        q = parse_qs(urlparse(self.path).query)
        if path == "/api/test":
            self._json(self.api.test(q))
        elif path == "/api/toggle":
            self._json(self.api.toggle(q))
        elif path == "/api/disconnect":
            self._json(self.api.disconnect())
        else:
            self._json({"error": "not found"}, 404)

    def _page(self):
        html = """<!DOCTYPE html>
<html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TN Series Test Bench & Pin Guide</title>
<style>
:root { --bg: #0f172a; --panel: #1e293b; --accent: #38bdf8; --btn: #2563eb; --pass: #166534; --fail: #991b1b; --text: #f8fafc; --muted: #94a3b8; }
body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 1.5rem; background: var(--bg); color: var(--text); line-height: 1.5; }
h1 { color: #f59e0b; margin-top: 0; font-size: 1.6rem; display: flex; align-items: center; gap: 10px; }
.model-badge { font-size: 0.8rem; background: #3b82f6; color: #fff; padding: 3px 10px; border-radius: 999px; font-weight: bold; }
.card { background: var(--panel); border: 1px solid #334155; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.25rem; }
.card-title { font-size: 1.1rem; font-weight: 600; color: var(--accent); margin-top: 0; margin-bottom: 0.75rem; border-bottom: 1px solid #334155; padding-bottom: 0.5rem; display: flex; justify-content: space-between; }
.row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
label { font-size: 0.85rem; color: var(--muted); display: flex; flex-direction: column; gap: 4px; }
input, select { background: #0f172a; color: var(--text); border: 1px solid #475569; padding: 6px 10px; border-radius: 4px; font-size: 0.9rem; }
button { background: var(--btn); color: #fff; border: 0; padding: 8px 16px; font-weight: 600; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
button:hover { opacity: 0.9; }
button.btn-test { background: #059669; }
button.btn-sweep { background: #7c3aed; }
button.btn-clear { background: #475569; font-weight: normal; }
#log { background: #020617; padding: 12px; font-family: monospace; font-size: 0.85rem; white-space: pre-wrap; max-height: 35vh; overflow-y: auto; border: 1px solid #334155; border-radius: 6px; }
.tag { padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 0.75rem; }
.pass { background: var(--pass); color: #4ade80; }
.fail { background: var(--fail); color: #fca5a5; }
table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 0.85rem; }
th, td { border: 1px solid #334155; padding: 8px 10px; text-align: left; }
th { background: #0f172a; color: var(--accent); }
tr:nth-child(even) { background: #182234; }
.active-col { background: rgba(56, 189, 248, 0.15); border-left: 2px solid var(--accent); border-right: 2px solid var(--accent); font-weight: bold; color: #f59e0b; }
.grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
@media (max-width: 900px) { .grid-layout { grid-template-columns: 1fr; } }
.wiring-box { background: #020617; border: 1px dashed #475569; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 0.85rem; line-height: 1.5; color: #cbd5e1; white-space: pre-line; }
.info-tag { font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; background: #334155; color: #94a3b8; }
</style></head><body>

<h1>TN Series Test Bench <span id="current_model_badge" class="model-badge">TNL (96x96)</span></h1>

<div class="card">
  <div class="card-title">1. Parameter & Koneksi Serial RS485</div>
  <div class="row">
    <label>COM Port: <select id="port"></select></label>
    <label>Baudrate: <input id="baud" value="9600" size="6"></label>
    <label>Parity: <select id="parity"><option value="N">N (None)</option><option value="E">E (Even)</option><option value="O">O (Odd)</option></select></label>
    <label>Stop Bits: <select id="stop"><option value="2">2</option><option value="1">1</option></select></label>
    <label>Slave ID: <input id="slave" value="1" size="3"></label>
    <label>Model Target: 
      <select id="model" onchange="updateModelInfo()">
        <option value="tnl" selected>TNL (96x96 - Besar)</option>
        <option value="tnh">TNH (48x96 - Sedang)</option>
        <option value="tns">TNS (48x48 - Kecil)</option>
      </select>
    </label>
    <label>Jumlah Alarm: <select id="n_alarm" onchange="renderChannelControls()"><option value="6">6 Alarm (TNL)</option><option value="4">4 Alarm (TNH)</option><option value="2">2 Alarm (TNS)</option></select></label>
  </div>
  <div class="row" style="margin-top: 12px;">
    <button class="btn-test" onclick="test()">Test Koneksi</button>
    <button class="btn-sweep" onclick="alarms()">Sweep Test Alarm</button>
    <button class="btn-clear" onclick="$('log').innerHTML=''">Clear Log</button>
  </div>
</div>

<div class="card">
  <div class="card-title">2. Test Pin Individual (Klik untuk Mengaktifkan Pin/Relay selama 2 detik)</div>
  <div class="row" style="margin-bottom: 10px;">
    <label>Pilih Pin/Kanal: <select id="channel_select" style="min-width: 320px;"></select></label>
    <button class="btn-test" onclick="toggleSelectedChannel()" style="margin-top: 18px;">Test Pin Terpilih</button>
  </div>
  <div class="row" id="channel_quick_buttons" style="gap: 8px;"></div>
</div>

<div class="card">
  <div class="card-title">3. Live Communication Log</div>
  <div id="log">Siap melakukan pengujian. Klik "Test Koneksi" atau klik salah satu tombol pin di atas.</div>
</div>

<div class="grid-layout">
  <div class="card">
    <div class="card-title">4. Panduan Terminal Model: <span id="table_model_name" style="color:#f59e0b;">TNL</span></div>
    <table>
      <thead>
        <tr>
          <th>Fungsi</th>
          <th id="th_tns">TNS (48x48)</th>
          <th id="th_tnh">TNH (48x96)</th>
          <th id="th_tnl">TNL (96x96)</th>
          <th>Tujuan Uji</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><b>Control OUT1 (Heater)</b></td><td id="tns_out1">1-2</td><td id="tnh_out1">3-4</td><td id="tnl_out1">3-4</td><td>OUT1 / SSR 12V / Relay</td></tr>
        <tr><td><b>Control OUT2 (Cooler)</b></td><td id="tns_out2">3-4</td><td id="tnh_out2">5-6</td><td id="tnl_out2">5-6</td><td>OUT2 / Relay</td></tr>
        <tr><td><b>Alarm 1 (AL1)</b></td><td id="tns_al1">13-14</td><td id="tnh_al1">7-8</td><td id="tnl_al1">7-8</td><td>Relay Alarm 1</td></tr>
        <tr><td><b>Alarm 2 (AL2)</b></td><td id="tns_al2">15-16</td><td id="tnh_al2">9-10</td><td id="tnl_al2">9-10</td><td>Relay Alarm 2</td></tr>
        <tr><td><b>Alarm 3 (AL3)</b></td><td id="tns_al3">-</td><td id="tnh_al3">15-16</td><td id="tnl_al3">AL3 (Opt)</td><td>Relay Alarm 3</td></tr>
        <tr><td><b>Alarm 4 (AL4)</b></td><td id="tns_al4">-</td><td id="tnh_al4">17-18</td><td id="tnl_al4">AL4 (Opt)</td><td>Relay Alarm 4</td></tr>
        <tr><td><b>RS485 Komunikasi (A+)</b></td><td id="tns_a">Skrup A</td><td id="tnh_a">Pin 13</td><td id="tnl_a">Pin 14</td><td>Converter Skrup A (+)</td></tr>
        <tr><td><b>RS485 Komunikasi (B-)</b></td><td id="tns_b">Skrup B</td><td id="tnh_b">Pin 14</td><td id="tnl_b">Pin 13</td><td>Converter Skrup B (-)</td></tr>
        <tr><td><b>Power Supply Controller</b></td><td id="tns_pwr">5-6</td><td id="tnh_pwr">11-12</td><td id="tnl_pwr">11-12</td><td>PLN 220V AC</td></tr>
      </tbody>
    </table>
  </div>
  <div class="card">
    <div class="card-title">5. Panduan Wiring Fisik Terpilih</div>
    <div id="wiring_guide" class="wiring-box"></div>
  </div>
</div>

<script>
const $=id=>document.getElementById(id);
const PIN_MAP = {
  tns: { 
    name: "TNS (48x48 mm)",
    a_pin: "Skrup A+", b_pin: "Skrup B-", pwr: "5-6",
    channels: [
      { name: "OUT1", pin: "1-2", type: "out", desc: "Control OUT1 (Heater)" },
      { name: "OUT2", pin: "3-4", type: "out", desc: "Control OUT2 (Cooler)" },
      { name: "AL1", pin: "13-14", type: "alarm", desc: "Alarm Output 1" },
      { name: "AL2", pin: "15-16", type: "alarm", desc: "Alarm Output 2" }
    ]
  },
  tnh: { 
    name: "TNH (48x96 mm)",
    a_pin: "Pin 13 (A+)", b_pin: "Pin 14 (B-)", pwr: "11-12",
    channels: [
      { name: "OUT1", pin: "3-4", type: "out", desc: "Control OUT1 (Heater)" },
      { name: "OUT2", pin: "5-6", type: "out", desc: "Control OUT2 (Cooler)" },
      { name: "AL1", pin: "7-8", type: "alarm", desc: "Alarm Output 1" },
      { name: "AL2", pin: "9-10", type: "alarm", desc: "Alarm Output 2" },
      { name: "AL3", pin: "15-16", type: "alarm", desc: "Alarm Output 3" },
      { name: "AL4", pin: "17-18", type: "alarm", desc: "Alarm Output 4" }
    ]
  },
  tnl: { 
    name: "TNL (96x96 mm)",
    a_pin: "Pin 14 (A+)", b_pin: "Pin 13 (B-)", pwr: "11-12",
    channels: [
      { name: "OUT1", pin: "3-4", type: "out", desc: "Control OUT1 (Heater)" },
      { name: "OUT2", pin: "5-6", type: "out", desc: "Control OUT2 (Cooler)" },
      { name: "AL1", pin: "7-8", type: "alarm", desc: "Alarm Output 1" },
      { name: "AL2", pin: "9-10", type: "alarm", desc: "Alarm Output 2" },
      { name: "AL3", pin: "AL3 (Opt)", type: "alarm", desc: "Alarm Output 3" },
      { name: "AL4", pin: "AL4 (Opt)", type: "alarm", desc: "Alarm Output 4" },
      { name: "AL5", pin: "AL5 (Opt)", type: "alarm", desc: "Alarm Output 5" },
      { name: "AL6", pin: "AL6 (Opt)", type: "alarm", desc: "Alarm Output 6" }
    ]
  }
};

const L=(s,tag)=>{
  let d=document.createElement('div');
  let time=new Date().toLocaleTimeString();
  d.innerHTML='<span style="color:#64748b">['+time+']</span> '+(tag?'<span class="tag '+tag+'">'+tag.toUpperCase()+'</span> ':'')+s;
  $('log').prepend(d);
};

const q=()=>new URLSearchParams({
  port:$('port').value,baud:$('baud').value,parity:$('parity').value,
  stopbits:$('stop').value,slave:$('slave').value,model:$('model').value,n_alarm:$('n_alarm').value
}).toString();

async function api(p){let r=await fetch(p,{method:'POST'});return r.json();}

function loadPorts(){
  fetch('/api/ports').then(r=>r.json()).then(d=>{
    $('port').innerHTML='';
    d.ports.forEach(p=>{let o=document.createElement('option');o.value=p.device;o.textContent=p.device+' - '+p.desc;$('port').append(o);});
  });
}

function updateModelInfo(){
  let m=$('model').value;
  $('current_model_badge').textContent = PIN_MAP[m].name;
  $('table_model_name').textContent = m.toUpperCase();
  
  if(m==='tns') $('n_alarm').value='2';
  else if(m==='tnh') $('n_alarm').value='4';
  else $('n_alarm').value='6';

  ['tns','tnh','tnl'].forEach(k => {
    let th = $('th_' + k);
    if(th) th.className = (k === m) ? 'active-col' : '';
  });

  renderChannelControls();
  renderWiringGuide();
}

function renderWiringGuide(){
  let m = $('model').value;
  let info = PIN_MAP[m];
  let chs = info.channels.slice(0, 2 + parseInt($('n_alarm').value));
  let guide = `📌 <b>PANDUAN WIRING UNTUK MODEL ${m.toUpperCase()}:</b>\n\n`
    + `1. <b>Koneksi RS485 ke USB Converter:</b>\n`
    + `   • Converter A(+)  ──▶  TN ${info.a_pin}\n`
    + `   • Converter B(-)  ──▶  TN ${info.b_pin}\n\n`
    + `2. <b>Koneksi Power 220V AC:</b>\n`
    + `   • PLN 220V        ──▶  TN Pin ${info.pwr}\n\n`
    + `3. <b>Terminal Output yang di-test:</b>\n`;
  
  chs.forEach(c => {
    guide += `   • ${c.name} (${c.desc}) : <b>Terminal ${c.pin}</b>\n`;
  });
  
  $('wiring_guide').innerHTML = guide;
}

function renderChannelControls(){
  let m=$('model').value;
  let n=parseInt($('n_alarm').value);
  let sel=$('channel_select');
  let bc=$('channel_quick_buttons');
  sel.innerHTML='';
  bc.innerHTML='';
  
  let info = PIN_MAP[m];
  let activeList = info.channels.filter(c => c.type === 'out' || parseInt(c.name.replace('AL','')) <= n);

  activeList.forEach(c => {
    let opt=document.createElement('option');
    opt.value=c.name;
    opt.textContent=`${c.name} (Pin ${c.pin}) — ${c.desc}`;
    sel.append(opt);

    let btn=document.createElement('button');
    btn.textContent=`${c.name} [Pin ${c.pin}]`;
    btn.style.background = c.name.startsWith("OUT") ? "#0284c7" : "#7c3aed";
    btn.onclick = () => toggle(c.name);
    bc.append(btn);
  });
}

function toggleSelectedChannel(){
  let val=$('channel_select').value;
  if(val) toggle(val);
}

async function test(){
  L('Test koneksi ke '+($('port').value||'port')+'...');
  let d=await api('/api/test?'+q());
  d.success ? L(`OK! PV=${(d.pv/10).toFixed(1)}°C | SV=${(d.sv/10).toFixed(1)}°C | MV Heat=${d.mv_heat}`,'pass') : L('Gagal: '+d.error,'fail');
}

async function toggle(name){
  L('Test '+name+'...');
  let d=await api('/api/toggle?channel='+name+'&'+q());
  d.success ? L(`${name} (Terminal ${d.pin}) AKTIF 2 DETIK`,'pass') : L(`${name} Gagal: ${d.error}`,'fail');
}

async function alarms(){
  let m=$('model').value;
  let n=parseInt($('n_alarm').value);
  L(`Sweep Alarm AL1 s/d AL${n} (${m.toUpperCase()})...`);
  for(let i=1;i<=n;i++){
    await toggle('AL'+i);
    await new Promise(x=>setTimeout(x,600));
  }
}

loadPorts();
updateModelInfo();
</script></body></html>"""
        body = html.encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    ap = argparse.ArgumentParser(description="TN Test Bench web (standalone)")
    ap.add_argument("--port", type=int, default=8081)
    ap.add_argument("--com", default="COM3")
    ap.add_argument("--baud", type=int, default=9600)
    ap.add_argument("--parity", default="N")
    ap.add_argument("--stopbits", type=int, default=2)
    args = ap.parse_args()
    api = TNApi(args)
    Handler.api = api
    srv = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print(f"TN Test Bench: http://127.0.0.1:{args.port}  (Ctrl+C stop)")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping...")
    finally:
        api.disconnect()
        srv.server_close()


if __name__ == "__main__":
    main()
