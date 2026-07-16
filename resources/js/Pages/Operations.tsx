import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ReactNode, useState } from 'react';

type Module = 'scada' | 'historian' | 'trend' | 'alarm' | 'notifications' | 'machines' | 'communication' | 'database';
type Props = { module: Module };

const Badge = ({ children, tone = 'green' }: { children: ReactNode; tone?: 'green' | 'amber' | 'red' | 'blue' }) => {
    const colors = { green: 'bg-emerald-100 text-emerald-700', amber: 'bg-amber-100 text-amber-700', red: 'bg-red-100 text-red-700', blue: 'bg-blue-100 text-blue-700' };
    return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors[tone]}`}>{children}</span>;
};

const Panel = ({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) => (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
        {title && <h3 className="mb-4 font-semibold text-slate-800">{title}</h3>}{children}
    </section>
);

const Value = ({ label, value, unit }: { label: string; value: string; unit?: string }) => (
    <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-bold text-slate-800">{value} <span className="text-xs font-normal text-slate-400">{unit}</span></p></div>
);

function EquipmentWidget({ type }: { type: 'Boiler' | 'Retort' | 'TNH' }) {
    const values = type === 'Boiler'
        ? [['Temperature', '121.4', '°C'], ['Pressure', '1.8', 'bar'], ['Water Level', '78', '%'], ['Heater', 'ON', '']]
        : type === 'Retort'
          ? [['Temperature', '120.8', '°C'], ['Pressure', '1.7', 'bar'], ['Holding Time', '18:42', ''], ['Door', 'Locked', ''], ['Steam Valve', 'Open', ''], ['Cooling Valve', 'Closed', ''], ['Drain Valve', 'Closed', '']]
          : [['PV', '121.2', '°C'], ['SV', '121.5', '°C'], ['Output', '68', '%'], ['Alarm', 'None', ''], ['Mode', 'Auto', ''], ['Communication', 'Online', '']];
    return <Panel title={`${type} Widget`}><div className="grid grid-cols-2 gap-2">{values.map(([label, value, unit]) => <Value key={label} label={label} value={value} unit={unit} />)}</div>{type !== 'TNH' && <div className="mt-3 flex items-center justify-between"><span className="text-sm text-slate-500">Alarm</span><Badge>Normal</Badge></div>}<div className="mt-3 flex items-center justify-between"><span className="text-sm text-slate-500">Status</span><Badge>Running</Badge></div></Panel>;
}

function Scada() {
    const flow = [['Water Tank', '82%', '💧'], ['Pump', 'Running', '⚙️'], ['Boiler', '121.4 °C', '🔥'], ['Steam Pipe', '1.8 bar', '〰️'], ['Steam Valve', 'Open', '🔧'], ['Retort', '120.8 °C', '🏭'], ['Cooling', 'Standby', '❄️'], ['Drain', 'Closed', '⬇️']];
    return <><Panel><div className="mb-5 flex items-center justify-between"><div><h3 className="font-semibold text-slate-800">Realtime Mimic Diagram</h3><p className="text-sm text-slate-500">Live process overview · updated just now</p></div><Badge>System Online</Badge></div><div className="flex flex-col items-center">{flow.map(([name, value, icon], index) => <div key={name} className="contents"><div className="flex w-full max-w-xl items-center gap-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 shadow-sm"><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-100 text-xl">{icon}</span><div className="flex-1"><p className="font-semibold text-slate-800">{name}</p><p className="text-xs text-slate-500">Realtime object</p></div><span className="font-mono text-sm font-semibold text-cyan-700">{value}</span><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /></div>{index < flow.length - 1 && <div className="h-7 border-l-2 border-dashed border-cyan-400"><span className="relative left-[-7px] top-3 text-xs text-cyan-500">▼</span></div>}</div>)}</div></Panel><div className="grid gap-5 xl:grid-cols-3"><EquipmentWidget type="Boiler"/><EquipmentWidget type="Retort"/><EquipmentWidget type="TNH"/></div></>;
}

function Historian() {
    const [period, setPeriod] = useState('Hari');
    return <><Panel><div className="flex flex-wrap items-end gap-3"><div><label className="mb-1 block text-xs font-medium text-slate-500">Filter periode</label><div className="flex rounded-lg bg-slate-100 p-1">{['Hari', 'Minggu', 'Bulan'].map(x => <button key={x} onClick={() => setPeriod(x)} className={`rounded-md px-4 py-2 text-sm ${period === x ? 'bg-white font-semibold text-cyan-700 shadow-sm' : 'text-slate-500'}`}>{x}</button>)}</div></div><div><label className="mb-1 block text-xs font-medium text-slate-500">Custom Date</label><input type="date" className="rounded-lg border-slate-300 text-sm" /></div><div className="ml-auto flex gap-2">{['Excel', 'CSV', 'PDF'].map(x => <button key={x} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Export {x}</button>)}</div></div></Panel><Panel title="Process History"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-xs uppercase text-slate-400"><tr>{['Time', 'Machine', 'Temperature', 'Pressure', 'Output', 'Status'].map(x => <th key={x} className="px-3 py-3">{x}</th>)}</tr></thead><tbody>{[['10:42:18','Retort-01','120.8 °C','1.7 bar','68%'],['10:41:18','Boiler-01','121.4 °C','1.8 bar','72%'],['10:40:18','Retort-02','84.2 °C','0.8 bar','34%']].map(r => <tr key={r[0]+r[1]} className="border-b border-slate-100">{r.map(x => <td key={x} className="px-3 py-3 text-slate-600">{x}</td>)}<td className="px-3 py-3"><Badge>Normal</Badge></td></tr>)}</tbody></table></div></Panel></>;
}

function Trend() {
    return <Panel title="Realtime Chart"><div className="mb-5 flex flex-wrap gap-4 text-sm"><span className="text-red-500">● Temperature</span><span className="text-blue-500">● Pressure</span><span className="text-amber-500">● Output</span><Badge>Live</Badge></div><div className="relative h-80 overflow-hidden rounded-lg border bg-slate-50 p-4"><div className="absolute inset-0 opacity-50" style={{backgroundImage:'linear-gradient(#cbd5e1 1px,transparent 1px),linear-gradient(90deg,#cbd5e1 1px,transparent 1px)',backgroundSize:'50px 40px'}}/><svg className="relative h-full w-full" viewBox="0 0 800 260" preserveAspectRatio="none"><polyline fill="none" stroke="#ef4444" strokeWidth="3" points="0,190 80,175 160,160 240,130 320,105 400,92 480,70 560,76 640,62 720,65 800,55"/><polyline fill="none" stroke="#3b82f6" strokeWidth="3" points="0,220 80,210 160,205 240,185 320,178 400,165 480,150 560,158 640,145 720,148 800,138"/><polyline fill="none" stroke="#f59e0b" strokeWidth="3" points="0,235 80,220 160,225 240,200 320,185 400,190 480,170 560,180 640,160 720,168 800,150"/></svg></div></Panel>;
}

function Alarm() {
    const rows = [['10:31:04','High temperature detected','Retort-01','Critical'],['09:48:22','Pressure approaching limit','Boiler-01','Warning'],['08:12:10','Cycle completed','Retort-02','Normal']];
    return <><div className="grid gap-4 md:grid-cols-3"><Panel><p className="text-sm text-slate-500">Normal</p><p className="mt-2 text-3xl font-bold text-emerald-600">18</p></Panel><Panel><p className="text-sm text-slate-500">Warning</p><p className="mt-2 text-3xl font-bold text-amber-500">2</p></Panel><Panel><p className="text-sm text-slate-500">Critical</p><p className="mt-2 text-3xl font-bold text-red-600">1</p></Panel></div><Panel title="Alarm History"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-xs uppercase text-slate-400"><tr>{['Time','Message','Machine','Status'].map(x=><th key={x} className="px-3 py-3">{x}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r[0]} className="border-b border-slate-100"><td className="px-3 py-4 font-mono text-slate-500">{r[0]}</td><td className="px-3 py-4 font-medium text-slate-700">{r[1]}</td><td className="px-3 py-4 text-slate-500">{r[2]}</td><td className="px-3 py-4"><Badge tone={r[3]==='Critical'?'red':r[3]==='Warning'?'amber':'green'}>{r[3]}</Badge></td></tr>)}</tbody></table></div></Panel></>;
}

function Notifications() { return <Panel title="Notification Channels"><div className="divide-y">{[['Browser Notification','Active',false],['Email','Future',true],['WhatsApp','Future',true],['Telegram','Future',true]].map(([name,status,future])=><div key={String(name)} className="flex items-center justify-between py-4"><div><p className="font-medium text-slate-700">{name}</p><p className="text-sm text-slate-400">Receive SCADA alarms via this channel</p></div>{future?<Badge tone="blue">Future</Badge>:<label className="flex items-center gap-2 text-sm text-emerald-600"><input type="checkbox" defaultChecked className="rounded border-slate-300 text-cyan-600"/>{status}</label>}</div>)}</div></Panel> }

function Machines() { const list=[['Boiler-01','Boiler','Online'],['Retort-01','Retort','Online'],['Retort-02','Retort','Offline']]; return <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{list.map(([name,type,status])=><Panel key={name}><div className="flex justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-2xl">🏭</span><Badge tone={status==='Online'?'green':'red'}>{status}</Badge></div><h3 className="mt-4 text-lg font-bold text-slate-800">{name}</h3><p className="text-sm text-slate-500">{type} Process Machine</p><div className="my-4 grid grid-cols-2 gap-2"><Value label="Temperature" value={status==='Online'?'121.2':'--'} unit="°C"/><Value label="Pressure" value={status==='Online'?'1.7':'--'} unit="bar"/></div><Link href={route('tn.index')} className="block rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-slate-800">View Detail →</Link></Panel>)}</div> }

function Communication() { return <div className="grid gap-5 lg:grid-cols-2"><Panel title="ESP32 Communication"><div className="mb-5 flex items-center justify-between"><span className="text-4xl">📡</span><Badge>Online</Badge></div><div className="grid grid-cols-2 gap-3"><Value label="RSSI" value="-58" unit="dBm"/><Value label="Last Update" value="2 sec" unit="ago"/><Value label="IP Address" value="192.168.1.42"/><Value label="Uptime" value="14d 06h"/></div></Panel><Panel title="TNH Communication"><div className="mb-5 flex items-center justify-between"><span className="text-4xl">🌡️</span><Badge>Online</Badge></div><div className="grid grid-cols-2 gap-3"><Value label="Slave ID" value="1"/><Value label="Protocol" value="Modbus"/><Value label="Response" value="24" unit="ms"/><Value label="Status" value="Healthy"/></div></Panel></div> }

function Database() { const tables=['users','roles','permissions','machines','devices','tnh_registers','temperature_logs','pressure_logs','alarm_logs','communication_logs','events']; return <Panel title="Database Structure"><p className="mb-5 text-sm text-slate-500">Operational tables required by the SCADA system.</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{tables.map((x,i)=><div key={x} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"><span className="text-xl">🗄️</span><div><p className="font-mono text-sm font-semibold text-slate-700">{x}</p><p className="text-xs text-slate-400">{i < 2 || x === 'devices' ? 'Available / planned schema' : 'Planned schema'}</p></div></div>)}</div></Panel> }

const titles: Record<Module, [string,string]> = { scada:['SCADA','Realtime process monitoring'], historian:['Historian','Process data logs and export'], trend:['Trend','Realtime process chart'], alarm:['Alarm','Active alarms and event history'], notifications:['Notification','Alarm notification channels'], machines:['Machine','Machine list and details'], communication:['Device Communication','ESP32 and TNH connection status'], database:['Database','SCADA data structure'] };

export default function Operations({ module }: Props) {
    const [title, subtitle] = titles[module];
    const content = { scada:<Scada/>, historian:<Historian/>, trend:<Trend/>, alarm:<Alarm/>, notifications:<Notifications/>, machines:<Machines/>, communication:<Communication/>, database:<Database/> }[module];
    return <AuthenticatedLayout header={<div><h2 className="text-xl font-semibold text-slate-800">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>}><Head title={title}/><div className="space-y-5 p-4 sm:p-6 lg:p-8">{content}</div></AuthenticatedLayout>;
}
