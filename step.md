# SCADA Design Specification - Mesin Retort

## Tujuan

Menyempurnakan tampilan SCADA berdasarkan mesin retort asli.

SCADA harus mengikuti perilaku mesin asli berdasarkan:

- SOP Operasional
- Panel Kontrol
- Wiring Panel
- HMI Original

Jangan mengubah alur kerja mesin.

Seluruh kontrol dan monitoring harus mengikuti mesin asli.

---

# Layout

SCADA menggunakan satu halaman utama sebagai halaman monitoring.

Pada halaman utama terdapat beberapa area.

- Boiler
- Jalur Steam
- Retort
- Cooling
- Drain
- Status Mesin
- Alarm
- Event

Semua komponen harus saling terhubung mengikuti alur proses sebenarnya.

---

# Boiler

Boiler berada di sisi kiri.

Menampilkan:

- Water Level
- Pressure
- Burner
- Gas
- Pilot Flame
- Steam Ready
- Status Boiler

Status yang mungkin muncul:

- OFF
- Filling
- Heating
- Ready
- Alarm

---

# Jalur Steam

Boiler terhubung menuju Retort.

Di jalur ini terdapat:

- Steam Valve
- Steam Pipe

Saat steam aktif:

- Valve berubah menjadi OPEN
- Steam Pipe memiliki animasi aliran

Saat steam mati:

- Valve CLOSE
- Tidak ada animasi

---

# Retort

Retort berada di sisi kanan.

Monitoring yang ditampilkan:

- Temperatur Aktual
- Target Temperatur
- Current Step
- Remaining Time
- Door Lock
- Cooling Air
- Cooling Water
- Compressor
- Safety Valve

Status:

- Waiting
- Heating
- Holding
- Cooling
- Finish
- Alarm

---

# Cooling

Cooling berada di bagian bawah retort.

Komponen:

- Cooling Water
- Cooling Air
- Drain

Ketika cooling aktif:

Cooling Water berubah menjadi ON.

Cooling Air berubah menjadi ON.

Animasi air muncul.

---

# Drain

Drain hanya aktif ketika temperatur mencapai syarat sesuai SOP.

Saat drain aktif:

Valve OPEN.

Air keluar.

---

# Panel Kontrol

SCADA memiliki kontrol yang sama seperti panel asli.

Kontrol:

Power

Pompa Boiler

Pematik

Burner

Run

Stop

Cooling

Reset Alarm

Jangan menambahkan kontrol baru.

---

# Lampu Indikator

Lampu mengikuti panel asli.

Power

Steam

Burner

Air

Angin

Alarm

Warna lampu harus mengikuti kondisi sebenarnya.

---

# Monitoring

Monitoring utama:

Boiler Pressure

Retort Temperature

Boiler Status

Burner Status

Steam Status

Cooling Status

Compressor

Water Level

Current Step

Remaining Time

Door Lock

Semua nilai berubah secara realtime.

---

# Sequence Operasi

## 1

Power ON

↓

Panel Ready

---

## 2

Isi Air Boiler

↓

Pompa ON

↓

Level High

↓

Pompa OFF

---

## 3

Pematik ON

↓

Api Pematik Menyala

---

## 4

Burner ON

↓

Boiler Heating

↓

Pressure Naik

---

## 5

Pressure mencapai 4 Bar

↓

Burner OFF

↓

Pressure turun ke 3 Bar

↓

Burner ON

Loop otomatis.

---

## 6

Steam Ready

↓

Operator memasukkan produk.

↓

Door Lock.

---

## 7

Run Sterilisasi

↓

Steam Valve OPEN.

↓

Steam mengalir.

↓

Retort mulai Heating.

---

## 8

Temperatur naik.

↓

Current Step berjalan.

↓

Holding Time dimulai ketika target suhu tercapai.

---

## 9

Holding selesai.

↓

Alarm selesai proses.

↓

Steam OFF.

↓

Burner OFF.

---

## 10

Cooling ON.

↓

Cooling Water.

↓

Cooling Air.

↓

Temperatur turun.

---

## 11

Saat temperatur sesuai SOP.

↓

Drain OPEN.

↓

Buang air.

---

## 12

Pressure 0 Bar.

↓

Door Unlock.

↓

Produk diambil.

↓

Cycle selesai.

---

# Alarm

Alarm yang harus tersedia:

- High Pressure
- Low Pressure
- Low Water
- High Temperature
- Door Open
- Burner Failure
- Gas Failure
- Cooling Failure
- Sensor Error

Alarm harus muncul pada banner dan panel alarm.

---

# Event

SCADA mencatat seluruh aktivitas.

Contoh:

Power ON

Burner ON

Steam ON

Cooling ON

Drain OPEN

Cycle Finish

Alarm Active

Alarm Reset

---

# History

Menyimpan:

- Waktu mulai proses
- Waktu selesai
- Durasi proses
- Recipe
- Alarm
- Event

---

# Tampilan

SCADA harus dibuat menyerupai HMI asli tetapi lebih modern.

HMI asli digunakan sebagai referensi utama.

Jangan mengubah urutan proses.

Jangan mengubah nama kontrol.

Jangan mengubah logika mesin.

Fokus utama adalah membuat representasi digital mesin retort yang identik dengan perilaku mesin sebenarnya, namun dengan visualisasi yang lebih informatif dan mudah dipahami.