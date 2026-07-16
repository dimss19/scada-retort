# TN Series Step-by-Step Guide

---

# 1. Pendahuluan

**TN Series** merupakan perangkat pengendali suhu *Two-Degree-of-Freedom* (2-DOF) PID Temperature Controllers. 

**Fungsi Alat:**
Berfungsi untuk mengontrol suhu pada berbagai lingkungan secara akurat menggunakan algoritma 2-DOF PID, dengan mengkalkulasikan nilai yang diperlukan untuk kontrol yang ideal dan merespons gangguan secara cepat dan berpresisi tinggi.

**Jenis Model:**
- **Berdasarkan Ukuran:** TNS (48 x 48 mm), TNH (48 x 96 mm), dan TNL (96 x 96 mm).
- **Berdasarkan Tipe Kontrol:** *Program control model* (hingga 10 pattern x 20 step) dan *Fixed control model* (dengan fungsi timer).

**Fitur Utama:**
- Kecepatan *sampling* tinggi 50 ms dan akurasi tampilan ±0.2%.
- Kemampuan *simultaneous heating/cooling* (pemanasan dan pendinginan bersamaan) dan kontrol otomatis/manual.
- Fitur kontrol cerdas: Group PID, Zone PID, dan Anti Reset Windup (ARW).
- Mendukung pemantauan hingga 10 *events*.
- Tersedia output komunikasi RS485 (Modbus RTU/ASCII, Sync-Master, PLC ladderless) hingga 115,200 bps.
- Fungsi alarm heater putus (Heater burnout alarm) via input CT.
- Manajemen via PC menggunakan software DAQMaster.

---

# 2. Persiapan Sebelum Instalasi

Peralatan yang dibutuhkan:
- Obeng pipih (*flat head driver*).
- Terminal Crimp (Spesifikasi: Tipe Y atau Tipe O dengan lebar maksimum 5.8 mm).

Persiapan panel:
- Siapkan panel (*panel cutout*) dengan dimensi sesuai model:
  - TNS: 45⁺⁰.⁶ x 45⁺⁰.⁶ mm
  - TNH: 45⁺⁰.⁶ x 92⁺⁰.⁸ mm
  - TNL: 92⁺⁰.⁸ x 92⁺⁰.⁸ mm

Persiapan sensor:
- Pastikan ketersediaan sensor yang sesuai (Thermocouple tipe K, J, E, dll; RTD Pt100, Cu50; atau input Analog).
- Gunakan kabel kompensasi asli untuk Thermocouple.
- Untuk RTD, gunakan instalasi 3-wire dengan ketebalan dan panjang kabel yang sama persis (resistansi per kabel ≤ 5 Ω).

Persiapan power supply:
- Sediakan daya tegangan 100 - 240 VAC, 50/60 Hz.
- Siapkan kabel power (AWG 20 / 0.50 mm² atau lebih tebal).
- Siapkan sakelar daya (*power switch*) atau *circuit breaker* yang mudah dijangkau.

Persiapan output:
- Sesuaikan kebutuhan kontrol apakah menggunakan Relay (250 VAC 3A), SSR drive (12 VDC ±2V), atau Arus (0/4 - 20 mA).

Persiapan RS485:
- Gunakan kabel *twisted pair*.
- Siapkan *ferrite bead* di setiap ujung jalur kabel untuk mengurangi noise. Jarak maksimal kabel komunikasi adalah 800 m.

Hal-hal yang wajib diperhatikan:
> [!WARNING]
> Jauhkan kabel sinyal/sensor dan kabel komunikasi dari jalur tegangan tinggi atau jalur daya (power line) untuk menghindari *inductive noise*. Jangan menyatukan (*bundle*) kabel sensor dan komunikasi dengan kabel tegangan AC.

---

# 3. Instalasi

Langkah 1:
Siapkan lubang panel (*panel cutout*) sesuai dimensi yang disyaratkan.

Langkah 2:
Masukkan badan (body) temperature controller TN Series dari arah depan muka panel ke dalam lubang.

Langkah 3:
Pasang dan masukkan bracket (pengunci) dari sisi belakang controller. 

Langkah 4:
Gunakan obeng pipih (*flat head driver*) untuk mendorong ujung bracket searah panah hingga controller terpasang dengan erat dan kokoh ke panel.

---

# 4. Wiring

Perhatian: Kencangkan baut terminal dengan torsi 0.74 hingga 0.90 N.m. Perhatikan diagram koneksi pada fisik unit (TNS, TNH, TNL).

## Power
- **Fungsi Pin:** Menghidupkan unit. Tegangan 100 - 240 VAC.
- **Cara Penyambungan:**
  - TNS: Pin 5 dan Pin 6.
  - TNH & TNL: Pin 11 dan Pin 12.
- **Hal yang perlu diperhatikan:** Pastikan daya telah terputus sebelum melakukan penyambungan. 

## Sensor

## RTD
- **Fungsi Pin:** Membaca suhu dari *Resistance Thermometer* (misal: Pt100).
- **Cara Penyambungan:**
  - TNS: Pin 10 (A), Pin 11 (B), Pin 12 (B').
  - TNH & TNL: Pin 22 (A), Pin 23 (B), Pin 24 (B').
- **Hal yang perlu diperhatikan:** Gunakan penyambungan tipe 3-kabel. Jangan membalik polaritas A, B, B'.

## Thermocouple
- **Fungsi Pin:** Membaca suhu dari Thermocouple.
- **Cara Penyambungan:**
  - TNS: Pin 11 (+) dan Pin 12 (-).
  - TNH & TNL: Pin 23 (+) dan Pin 24 (-).
- **Hal yang perlu diperhatikan:** Gunakan kabel kompensasi yang tepat. Jangan terbalik antara (+) dan (-).

## Analog Input
- **Fungsi Pin:** Menerima masukan voltase (V) atau arus (mA).
- **Cara Penyambungan:**
  - TNS: Pin 11 (+) dan Pin 12 (-).
  - TNH & TNL: Pin 23 (+) dan Pin 24 (-).

## Output Relay
- **Fungsi Pin:** Output kontak fisik.
- **Cara Penyambungan:**
  - OUT 1: Hubungkan beban (load) ke Pin 1 dan Pin 2 (pada TNS, TNH, TNL).
  - OUT 2: Hubungkan beban ke Pin 3 & 4 (pada TNS), atau Pin 5 & 6 (pada TNH, TNL).
- **Hal yang perlu diperhatikan:** Kapasitas relay adalah 250 VAC 3A. Tambahkan kontaktor eksternal jika daya pemanas besar.

## SSR
- **Fungsi Pin:** Menggerakkan Solid State Relay eksternal. Tegangan output DC.
- **Cara Penyambungan:**
  - OUT 1: Pin 1 (+) dan Pin 2 (-).
  - OUT 2: Pin 3 (+) dan Pin 4 (-) (pada TNS), atau Pin 5 (+) dan Pin 6 (-) (pada TNH, TNL).
- **Hal yang perlu diperhatikan:** Perhatikan kutub (+) dan (-).

## Current Output
- **Fungsi Pin:** Transmisi arus analog (4-20mA / 0-20mA).
- **Cara Penyambungan:** Sama dengan terminal SSR. (Pin 1+, 2- dsb).
- **Hal yang perlu diperhatikan:** Batas resistansi beban (*load resistance*) adalah maksimal 500 Ω.

## RS485
- **Fungsi Pin:** Mengirim & menerima data serial.
- **Cara Penyambungan:**
  - TNS: Pin 7 (A+) dan Pin 8 (B-).
  - TNH & TNL: Pin 13 (A+) dan Pin 14 (B-).
- **Hal yang perlu diperhatikan:** Perhatikan polaritas A dan B.

---

# 5. Menyalakan Controller Pertama Kali

- **Urutan Booting:**
  1. Saat daya disuplai, seluruh display (LED) di panel depan menyala semua selama kurang lebih 1 detik.
  2. Nama model (misal: TNSP-42RR-RS-006) dan spesifikasi input (misal: KCaH) ditampilkan secara bergantian berkedip sebanyak dua kali (jeda 0.5 detik).
  3. Setelah itu, alat memasuki **RUN mode**.

- **Tampilan Awal:**
  - Angka bagian atas (Putih): `PV` (*Present Value*) atau suhu aktual.
  - Angka bagian tengah (Hijau): `SV` (*Setting Value*) atau suhu target.
  - Angka bagian bawah (Kuning, khusus TNH/TNL): *Operating value display* (menampilkan MV, Timer, atau CT secara default bergantung mode).

- **Arti Indikator (Status):**
  - `OUT1/2`: Menyala saat kontrol output 1/2 dalam kondisi ON.
  - `AT`: Berkedip setiap 1 detik saat proses Auto-tuning sedang berlangsung.
  - `MAN`: Menyala saat kontrol manual (*Manual control*) diaktifkan.
  - `STOP`: Menyala saat alat dihentikan beroperasi (Control output stop).
  - `AL1 to 6`: Menyala saat alarm aktif.

- **Cara memastikan alat berjalan normal:**
  Perhatikan tampilan `PV`. Jika menampilkan suhu ruangan yang logis (misal 25°C - 30°C), berarti alat mendeteksi sensor dengan normal. Jika tampilan berkedip `OPEN`, maka pemasangan sensor tidak terkoneksi dengan benar.

---

# 6. Mengenal Tombol

- **MODE [M]**
  - *Fungsi:* Masuk grup parameter, konfirmasi nilai, serta berpindah menu.
  - *Tekan singkat:* Pada RUN mode tidak banyak berpengaruh (atau memeriksa display). Di dalam menu parameter, tekan singkat untuk berpindah sub-parameter atau menyimpan perubahan (Save & Next).
  - *Tekan lama (2 detik):* Masuk ke *Parameter Group* dari RUN mode.
  - *Kombinasi M + [▲]:* (TNH/TNL) Mengubah baris parameter warna kuning (Operating value display part) di RUN mode (misal dari MV1 -> P/S1 -> TM1).

- **UP [▲] dan DOWN [▼]**
  - *Fungsi:* Pindah antar grup parameter atau mengubah angka nilai setting (menambah/mengurangi).

- **LEFT [◀]**
  - *Fungsi:* Menggeser posisi digit (*Shift digits*) ke kiri saat mengubah nilai (SV / Parameter) sehingga proses perubahan nilai menjadi lebih cepat.
  - *Tekan lama (2 detik):* Kembali ke layar sebelumnya (Return) atau keluar menuju RUN mode.

- **USER [U]**
  - *Fungsi:* Tombol *shortcut* cepat. Digunakan bersama dengan kombinasi tombol arah di RUN Mode untuk memicu aksi tanpa harus masuk menu dalam.
  - *Kombinasi:*
    - `[U]` + `[◀]` selama 2 detik: Memicu Shortcut 1 (SW-1).
    - `[U]` + `[▼]` selama 2 detik: Memicu Shortcut 2 (SW-2).
    - `[U]` + `[▲]` selama 2 detik: Memicu Shortcut 3 (SW-3).
    - *Tekan lama (2 detik):* Masuk secara instan ke dalam grup menu pilihan (fitur `SW-U`).

---

# 7. Struktur Menu

```text
RUN (Mode Operasi)
 ├── RUN  (Operation parameter group)
 ├── SV   (Multi SV parameter group)
 ├── PIdC (PID control parameter group)
 ├── IN   (Input parameter group)
 ├── PATN (Pattern parameter group) *Tampil khusus Program Control Model
 ├── CNTL (Control parameter group)
 ├── PIdG (PID group parameter group)
 ├── EVNT (Event parameter group)
 ├── ALM  (Alarm output parameter group)
 ├── COMM (Communication parameter group)
 ├── ETC  (Other parameter group)
 └── MON  (Monitoring parameter group)
```

---

# 8. Konfigurasi Awal

Langkah 1
Masuk ke pengaturan.
- Tekan dan tahan tombol `[M]` selama 2 detik. 
- Tekan `[▲]` / `[▼]` hingga masuk ke menu input `IN`.
- Tekan `[M]` untuk masuk ke parameter `IN`.

Langkah 2
- Tujuan: Menentukan tipe sensor.
- Parameter: `IN-T` (Input Type).
- Nilai: Pilih `KCaH` untuk thermocouple tipe K, atau `DPtH` untuk RTD (sesuaikan dengan sensor yang terpasang). Tekan `[M]` untuk konfirmasi.

Langkah 3
- Tujuan: Mengatur satuan unit suhu.
- Parameter: `UNIT`
- Nilai: Pilih `℃` (Celcius). Tekan `[M]`.

Langkah 4
- Tujuan: Membatasi rentang Set Value (Target Suhu).
- Parameter: `L-SV` (SV Low Limit) dan `H-SV` (SV High Limit).
- Nilai: Sesuaikan agar operator tidak dapat mengatur SV melampaui kemampuan mesin (misal `L-SV` = 0, `H-SV` = 400).

Langkah 5
- Tujuan: Menentukan metode kontrol alat.
- Keluar dari `IN` (tekan `[◀]` 2 detik), pindah ke menu `CNTL`.
- Parameter: `O-FT` (Control output operation).
- Nilai: Ubah ke `HEAT` untuk pemanas, `COOL` untuk pendingin, atau `H-C` untuk keduanya.
- Parameter: `C-MD` (Control Method).
- Nilai: `PID`.

Catatan: Setelah konfigurasi awal ini selesai, alat sudah mulai bisa membaca dan merespons suhu dengan standar nilai pabrik. Tekan `[◀]` selama 2 detik beberapa kali untuk kembali ke RUN mode.

---

# 9. Konfigurasi Sensor

Menu: Masuk ke grup `IN` -> `IN-T`

- **Thermocouple:** Pilih varian sesuai jenisnya seperti K, J, E, T, B, R, S, N, dll (Contoh layar: `KCaH`, `JIc`). 
  - Kapan digunakan: Rentang suhu yang ekstrim dan aplikasi daya tahan tinggi.
  - Range: Diatur oleh otomatis batas sensor. Suhu yang melampaui ini memunculkan `HHHH`.
- **RTD (Resistance Thermometer):** Pilih `DPtH`, `DPtL`, `JPtH`, dll.
  - Kapan digunakan: Ketika dibutuhkan akurasi yang lebih spesifik. Pastikan Anda memperhatikan tipe `H` (tanpa koma desimal) dan `L` (satu angka di belakang koma).
- **Analog:** Voltase (`AV1`, `AV2`, `AV3`) atau Arus (`AMV1`, `AMA1`, `AMA2`).
  - Kapan digunakan: Jika input bukanlah sensor langsung, melainkan dikirimkan oleh pemancar (transmitter) pihak ketiga (misalnya sinyal 4-20 mA merepresentasikan suhu -50 s/d 100°C).
  - Anda wajib mengatur parameter titik desimal (`DOT`), rentang skala bawah (`L-SC`), dan rentang skala atas (`H-SC`).

Catatan: Fungsi `IN-b` (Input Correction) pada grup `IN` digunakan untuk mengkalibrasi offset suhu (misal termometer menunjuk 80°C tapi alat membaca 78°C, isikan input correction `002`).

---

# 10. Konfigurasi PID

Menu: `PIdC`

- **Auto Tuning (`AT`)**
  - Fungsi: Mengkalkulasi nilai P, I, dan D yang ideal secara otomatis dengan mempelajari kecepatan reaksi pemanas dan lingkungan mesin.
  - Kapan digunakan: Wajib dilakukan saat mesin baru pertama dirakit atau instalasi elemen pemanas diubah. Indikator `AT` akan berkedip dan bila berhasil mati dengan sendirinya.
- **Manual PID (`H-P`, `H-I`, `H-D`)**
  - P (Proportional Band): `000.1` hingga `999.9` %. Semakin kecil, semakin tajam respons tapi dapat *hunting*.
  - I (Integral Time): `0` hingga `9999` Sec. Koreksi presisi offset.
  - D (Derivative Time): `0` hingga `9999` Sec. Menahan guncangan akibat perubahan paksa.
- **Alpha (`ALFA`)**
  - Fungsi: Menyesuaikan karakteristik kecepatan alat dalam mencapai *Set Value*. `0` mempercepat waktu mencapai SV. `100` memperlama laju agar tidak melonjak.
- **Zone PID (`ZONE`)**
  - Fungsi: Mengatur agar controller menggunakan nilai PID yang berbeda-beda tergantung zona rentang suhu (dibagi menjadi 4 zona maksimal).
  - Kapan digunakan: Untuk mesin yang sangat non-linear (misal oven dari 0-100°C sifatnya beda jauh dengan 400-500°C).
- **Group PID**
  - Berada pada menu grup `PIdG`, tempat untuk menyimpan dan menspesifikkan memori dari PID grup 0 hingga 7.
- **ARW (`ARw.b`)**
  - Fungsi: *Anti Reset Windup*. Mencegah sistem melakukan over-integrasi (menumpuk hitungan error saat start-up) yang menyebabkan overshoot ekstrim. Range: `50` to `200` %.

---

# 11. Konfigurasi Output

Menu: `CNTL`

- **Relay / SSR / Current Output (`oUt1`, `oUt2`)**
  - Pilih tipe output sesuai kemampuan fisik modul Anda. `CURR` (4-20mA / 0-20mA) atau `SSR`. 
- **Heating (`HEAT`) & Cooling (`COOL`) & Heating/Cooling (`H-C`)**
  - Masuk ke `O-FT`. Pilih `HEAT` jika mengontrol tungku/heater. Pilih `COOL` untuk kompresor/chiller. Pilih `H-C` untuk mengontrol keduanya secara berlawanan.
- **Cycle Time (`H-T` / `C-T`)**
  - Waktu siklus pulsa ON/OFF. 
  - Jika output Relay, gunakan nilai > `20.0` Sec agar relay mekanik tidak cepat rusak.
  - Jika output SSR, gunakan rentang `1.0` hingga `2.0` Sec untuk fluktuasi yang mulus.
- **Dead Band (`db`)**
  - Khusus mode `H-C` (Heating/Cooling simultan). Menjaga agar heater dan cooler tidak saling 'berkelahi' (misal menyala bersamaan di persimpangan target SV). Jika diberi nilai minus (-), maka terjadilah *Overlap Band*.

---

# 12. Konfigurasi Alarm

Diperlukan pengaturan kombinasi dari menu `EVNT` dan `ALM`.

- **Event (`Ev.N` dsb)**
  - Fungsi: Mendefinisikan kriteria kejadian. 
  - `AL.Md`: Mode peringatan. Pilih salah satu (misal: `DV[[` untuk alarm deviation limit atas, `PV[[` absolut batas atas).
  - Spesial Mode:
    - `LbA` (Loop break alarm): Menyala jika output 100% namun suhu diam dan tidak naik/turun melewati batas wajar (indikasi beban error).
    - `SbA` (Sensor break alarm): Menyala jika sensor mendadak putus.
    - `HbA1` / `HbA2` (Heater break alarm): Menyala jika bacaan komponen *Current Transformer* (CT) tidak mendeteksi arus saat output ON (heater putus).
- **Alarm Output Terminal & Logic (`ALM` group)**
  - `AL.N`: Pilih kontak terminal mana yang akan digunakan untuk mengeluarkan event (AL.1, AL.2, dll).
  - `AL.OC`: Logika kontak `NO` (Normally Open) atau `NC` (Normally Closed).
  - `AL.t` (Option):
    - `AL-A`: Standar.
    - `AL-B`: Latch. Alarm menyala dan tidak akan mati sebelum direst secara manual.
    - `AL-C`: Standby. Mengabaikan event alarm pertama kali saat power alat baru menyala hingga parameter masuk ke kondisi normal pertama kalinya.

---

# 13. Konfigurasi Komunikasi

Menu: `COMM` (Untuk mengakses ini pastikan tidak masuk via *Front key lock* yg dilarang).

- **Protocol (`COmP`)**: Pilih `RTU` (Modbus RTU), `ASCI` (Modbus ASCII), `SYNC` (Sync-Master), `MELC` (Mitsubishi), dll.
- **Slave Address (`AdRS`)**: Berikan ID alamat dari rentang `01` hingga `99`. Tiap perangkat RS485 wajib memiliki alamat tunggal.
- **Baudrate (`bPS`)**: Kecepatan transfer bit. `96` = 9600 bps. `384` = 38400 bps. `1152` = 115200 bps.
- **Parity (`PRTY`)**: `NONE` (Default), `ODD`, `EVEN`.
- **Stop Bit (`StP`)**: `1` atau `2` bit. (Jika parity `NONE`, secara default diakui sebagai 2).
- **Response Time (`RSw.t`)**: Waktu jeda controller membalas komunikasi. Default `20` ms.
- **PLC Address:** Khusus bagi mode sinkronisasi ladderless `MELC` dll. Parameternya antara lain `PLC.N`, `CPU.N`, `P.REG`, untuk mentransfer alamat mapping langsung ke data memori PLC secara mandiri.

---

# 14. Tutorial Setting RS485

Langkah 1
Dalam keadaan siap (RUN mode), tekan tombol `[M]` selama 2 detik untuk masuk ke halaman mode pengaturan.
↓
Langkah 2
Tekan tombol panah `[▼]` secara berulang hingga layar hijau menampilkan huruf `COMM` (Communication parameter group), lalu tekan tombol `[M]`.
↓
Langkah 3
Layar bagian bawah akan menampilkan parameter protokol `COmP`. Gunakan tombol `[▲]` / `[▼]` untuk memilih nilai `RTU` (untuk Modbus RTU). Setelah tampil, tekan `[M]` untuk mengunci memori.
↓
Langkah 4
Layar berpindah ke `AdRS` (Slave Address). Ubah angkanya dengan tombol panah (misal menjadi `01`), lalu tekan `[M]`.
↓
Langkah 5
Layar berpindah ke `bPS` (Baudrate). Tekan tombol panah untuk memilih `96` (mengindikasikan kecepatan 9600 bps). Tekan `[M]`.
↓
Langkah 6
Layar berpindah ke `PRTY` (Parity). Ubah menggunakan panah ke opsi `NONE`. Tekan `[M]`. (Anda bisa lewati parameter Stop bit berikutnya jika terisi 2 secara default).
↓
Langkah 7
Pengaturan Modbus RTU selesai di sisi alat. Tekan dan tahan tombol panah `[◀]` selama 2 detik untuk keluar dari menu `COMM` dan kembali ke RUN mode.
↓
Langkah 8
Verifikasi komunikasi. Gunakan software DAQMaster di PC yang tersambung kabel RS485. Lakukan koneksi Modbus RTU dengan konfigurasi ID `01`, `9600-8-N-2`. Jika data tampil secara real-time, sistem berhasil disetup.

---

# 15. Workflow Penggunaan

**Power ON**
(Alat menyala dan menampilkan model & kode input)
↓
**Setting Sensor**
(Masuk menu `IN`, atur `IN-T` sesuai tipe Thermocouple/RTD)
↓
**Setting PID & Control Mode**
(Masuk menu `CNTL`, atur mode ke `PID` dan output ke `HEAT`/`COOL`)
↓
**Setting Output**
(Pada menu yang sama atur `OUT1`/`OUT2` menjadi relay atau SSR, atur Cycle Time)
↓
**Setting Set Value (Target)**
(Kembali ke mode utama RUN, gunakan tombol `[▲]`/`[▼]` atur derajat SV)
↓
**Auto Tuning**
(Masuk menu `PIdC`, ubah `AT` ke `ON`. Mesin akan berkalibrasi otomatis)
↓
**Setting Alarm (Opsional)**
(Atur Trigger Event di `EVNT` dan Logic di `ALM` untuk keamanan)
↓
**Setting RS485 (Opsional)**
(Jalankan langkah komunikasi `COMM` jika dihubungkan ke HMI/SCADA)
↓
**Test**
(Pantau respons PV perlahan mengikuti SV, pastikan error `OPEN` dsb tidak muncul)
↓
**Selesai**

---

# 16. Daftar Parameter

| Group | Parameter | Nama Display | Fungsi | Nilai | Default | Catatan |
|---|---|---|---|---|---|---|
| **RUN** | Control output RUN/STOP | `R-S` | Menghentikan/menjalankan output | `RUN`, `STOP` | `STOP` | |
| | Pause timer/pattern | `t-S` | Jeda (Pause) waktu pola/timer | `CONT`, `PAUS` | `CONT` | |
| | Auto/Manual control | `AumA` | Pindah mode otomatis/manual | `AUTO`, `MAN` | `AUTO` | |
| | Heating/Cooling MV | `H-MV` / `C-MV` | Tampilan/seting nilai MV output | `0.0` to `100.0` | - | (%) |
| | Operation mode | `ModE` | Tipe kontrol normal/program | `FIX`, `PROG` | `PROG` | Program model |
| | 2-DOF PID control | `2doF` | Menghidupkan 2-DOF PID | `ON`, `OFF` | `ON` | |
| **SV** | Multi SV | `Sv.N` | Memilih SV aktif dari bank SV | `SV.0` to `SV.3` | `SV.0` | |
| | SV 0 to 3 setting | `Sv.0` to `Sv.3` | Mengatur besaran suhu target | `L-SV` to `H-SV` | `0` | |
| **PIdC** | Auto-tuning RUN/STOP | `AT` | Mengeksekusi kalibrasi Auto-tuning| `ON`, `OFF` | `OFF` | Tanda berkedip |
| | Auto-tuning mode | `At.t` | Tipe tuning (Berdasarkan rasio SV) | `TUN1`, `TUN2` | `TUN1` | |
| | Heating proportional band | `H-P` | Nilai proporsional pemanasan | `000.1` to `999.9`| `10.0` | ℃ / ℉ |
| | Heating integral time | `H-I` | Nilai integral waktu pemanasan | `0` to `9999` | `0240` | Sec |
| | Heating derivative time | `H-d` | Nilai derivative waktu pemanasan | `0` to `9999` | `0049` | Sec |
| | Cooling P, I, D | `C-P`, `C-I`, `C-d` | P, I, D khusus pendinginan | Sama dg Heating | Sama | |
| | Anti Reset Windup | `ARw.b` | Mencegah integral overshoot besar| `OFF`, `50` to `200` | `OFF` | (%) |
| | Alpha function | `ALFA` | Kurva kecepatan respons SV target | `0` to `100` | `60` | (%) |
| | Zone PID | `ZONE` | Opsi grup PID yang tersegmentasi | `ON`, `OFF` | `OFF` | |
| | Reference point L/C/H | `RP-L`, `RP-C`, `RP-H`| Titik batas rentang antar Zona PID | Sesuai Sensor | - | |
| | Reference point hysteresis | `zHYS` | Jeda (hysteresis) pergantian zona | `1` to `100` | `2` | ℃ / ℉ |
| **IN** | Input type | `IN-T` | Menentukan jenis sensor yang dibaca| `KCaH`, `AV1` dll| `KCaH` | Thermocouple, RTD|
| | Temperature unit | `UNIT` | Satuan pengukuran | `℃`, `℉` | `℃` | |
| | Analog L/H limit value | `L-RG`, `H-RG` | Kapasitas batasan raw input analog| - | `00.0`, `100.0`| |
| | Analog decimal & scale | `dot`, `L-SC`, `H-SC` | Titik koma dan rentang konversi PV | - | - | |
| | Input correction | `IN-b` | Kalibrasi toleransi error sensor | `-999` to `999` | `000` | Offset |
| | Input digital filter | `MAv.F` | Menstabilkan PV dari riak berlebih| `000.1` to `120.0`| `000.1` | Sec |
| | SV L/H limit value | `L-SV`, `H-SV` | Batasan SV yg dilock untuk operator| L-RG to H-RG | `-200`, `1350`| ℃ / ℉ |
| | Analog transmission | `Ao.M`, `Ao.R` dll | Retransmisi sinyal PV/SV ke analog| `4-20`, dll | `4-20` | mA |
| **PATN** | Program time unit | `tUNI` | Satuan dasar hitungan step/timer | `MM.SS`, `HH.MM`| `MM.SS` | Program model |
| | Pattern start condition | `PTnS` | Pola mulai operasional controller | `SSV`, `SPV` | `SSV` | |
| | Pattern standby action | `Wt.b`, `Wt.t` | Lebar deadband toleransi program | - | `2`, `00.00` | |
| | Pattern number & repeat | `PTnN`, `REP` | Pengulangan dan registrasi memori | `PTN.0` dll | `PTN.0`, `0` | |
| | Pattern state after end | `P.ENd` | Status stop otomatis pasca loop | `STOP`, `HOLD` dll| `STOP` | |
| | Pattern PID & Steps | `P.PId`, `StEP` | Pengaitan PID dan total blok langkah| `PId.0`, `0`to`20`| `PId.0`, `0` | |
| | Step SV & Time | `Ts□`, `Tm□` | SV dan Durasi target masing2 block| - | `0`, `00.00` | |
| **CNTL** | Control output operation | `O-FT` | Tipe pemanas/pendingin | `HEAT`, `COOL`, `H-C`| `H-C` | |
| | Control method | `C-MD` | Mekanisme kendali | `PID`, `ONOF` | `PID` | |
| | Sampling cycle | `SPl.t` | Tempo update PV | `50`, `100`, `250`| `50` | ms |
| | OUT 1/2 control output | `oUt1`, `oUt2` | Mendefinisikan rupa output pin | `SSR`, `CURR` | `CURR` | Tergantung H/W |
| | OUT 1/2 SSR drive method| `o1.SR`, `o2.SR` | Gaya gelombang SSR | `STND`, `CYCL` dll| `STND` | Standard / Phase |
| | Heating/Cooling cycle | `H-T`, `C-T` | Perputaran siklus on/off relay | `0.1` to `120.0` | `20.0` | Sec |
| | Dead band | `db` | Rentang mati suhu di mode H-C | `-999` to `999` | `0` | ℃ / ℉ |
| | Manual reset | `RESt` | Konversi offset sistem manual (P) | `000.0` to `100.0`| `050.0` | (%) |
| | H/C hysteresis & offset | `hHYS`, `hOST`, `cHYS`| Interval fluktuasi alarm & ON/OFF | `001` to `100` | `002`, `000` | ℃ / ℉ |
| | MV high/low limit | `L-MV`, `H-MV` | Pembatasan nilai manipulasi max/min| `000.0` to `100.0`| `000.0`, `100.0`| (%) |
| | Timer mode | `tM-F` | Penjadwalan output di Fix Model | `OFF`, `T.ON` dll| `OFF` | |
| | Timer ON/OFF/SV Set time| `t.oN`, `t.oFF`, `t.SEt`| Nilai kalibrasi jam otomatis alat | `00.00`to`99.59` | `00.00` | HH.MM |
| | Ramp up / down / time | `RAm.U`, `RAm.d`, `RAm.t`| Tanjakan perlahan menghindari kejut| `0` to `999` | `0` | |
| **PIdG** | PID group number | `PIdN` | Identifikasi nomor grup PID | `PId.0` to `PId.7`| `PId.0` | |
| | PID per group | `H-P`, `H-I`, `H-d` dll| Menyimpan P, I, D di masing-masing ID| - | - | |
| **EVNT** | Event | `Ev.N` | Menunjuk alarm yang disetting | `EV.0` to `EV.9` | `EV.0` | |
| | Alarm output mode | `AL.Md` | Tipe alarm (Deviation / LBA dll) | `OFF`, `DV[[` dll| `OFF` | |
| | Alarm L/H value & Hys | `AL.L`, `AL.H`, `AL.HY` | Batas picu trigger output alarm | - | `1550`, `001`| ℃ / ℉ |
| | LBA monitor & band | `LbA.t`, `LbA.b` | Sensitivitas Loop Break Alarm | `0000`, `002` | `0000`, `002` | Sec, ℃ |
| | Heater break value | `AL.L` (Jika mode HBA)| Limit amper putus heater | `00.0` to `50.0` | `00.0` | A |
| | Notice pattern / step | `AL.P`, `AL.o` | Status sinyal informasi output | `ALL` dll | `ALL` | |
| **ALM** | Alarm terminal & logic | `AL.N`, `LoGC` | Tujuan Port dan Logika | `AL.1`, `OR`/`AND`| `AL.1`, `OR` | |
| | Alarm option & contact | `AL.t`, `AL.oC` | Standby, Latch, kontak NC/NO | `AL-A`, `NO`/`NC` | `AL-A`, `NO` | |
| | Alarm ON/OFF delay | `AL.oN`, `AL.oF` | Delay waktu menyala dan mati | `0000` to `3600` | `0000` | Sec |
| **COMM** | Comm. protocol | `COmP` | Protokol transmisi RS485 | `RTU`, `ASCI` dll | `RTU` | |
| | Comm. address & BPS | `AdRS`, `bPS` | Alamat Slave dan Baudrate serial | `01`, `96`, dll | `01`, `96` | |
| | Parity, Stop bit, Wait | `PRTY`, `StP`, `RSw.t` | Formasi bit komunikasi serial | `NONE`, `2`, `20` | `NONE`, `2`, `20`| |
| | PLC comm. variables | `MAx.U`, `PLC.N` dll| Pengaturan untuk PLC Ladderless | - | - | |
| **ETC** | Power ON, initial SV | `PW.MV` | Instruksi awal bila daya masuk | `STOP`, `RUN` | `STOP` | |
| | Alarm occur, control | `AL.MV` | Operasi kontrol dikala alarm timbul| `CONT`, `OFF` | `CONT` | |
| | Manual control MV | `It.MV`, `Pr.MV` | Standar konversi Auto ke Manual MV| `AUTO`, dll | `AUTO` | |
| | Sensor error MV | `ER.MV` | Respon MV bila kabel sensor putus | `000.0` to `100.0`| `000.0` | (%) |
| | STOP, MV & Alarm | `St.MV`, `St.AL` | Respon SV / Alarm di status Stop | `000.0`, `CONT` | `000.0`, `CONT`| |
| | Soft start time & unit | `S.St`, `S.SUt` | Delay menanjak halus (Soft Start) | `0` to `9999` | `0` | |
| | Alarm latch clear | `AL.RE` | Resetter tahanan latch alarm | `NO`, `YES` | `NO` | |
| | Digital input (1-6) | `dI-1`, `dI-2` dll | Pemetaan input Digital Eksternal | `OFF`, `STOP` dll| `OFF` | |
| | Front shortcut key | `SW-U`, `SW-1` dll | Pemetaan aksi tombol U panel depan| `OFF`, `Al.RE` dll| `OFF` | |
| | User level & Password | `USER`, `PWd` | Enkripsi dan restriksi tampil menu | `STND`, `HIGH` | `STND`, `0000` | |
| | Front key lock | `LoCK` | Penahan akses ubah nilai di panel | `OFF`, `ON` | `OFF` | |
| | Parameter reset | `INIt` | Reset Pabrik | `NO`, `YES` | `NO` | Tidak mereset RS485 |
| **MON** | Monitoring Parameters | `H-MV`, `CtA1`, dll| Halaman baca status internal mesin | - | - | Read Only (Tidak diset) |

---

# 17. Error dan Troubleshooting

- **Tampilan: `OPEN`**
  - Penyebab: Sensor suhu terputus, tidak tersambung dengan benar, atau sensor rusak.
  - Solusi: Matikan alat. Cek sambungan dan polaritas kabel pada terminal input sensor. Jika menggunakan kawat kompensasi pastikan tembaga terjepit dengan benar.
- **Tampilan: `HHHH`**
  - Penyebab: Nilai aktual (PV) terdeteksi melampaui rentang kemampuan (limit) sensor tersebut. Kemungkinan mesin kehilangan kontrol sehingga terlalu panas.
  - Solusi: Pastikan heater bekerja di jalur wajar, atau cek parameter `IN-T` (Tipe input) sudah dikonfigurasi sesuai dengan jenis sensor fisik.
- **Tampilan: `LLLL`**
  - Penyebab: Suhu PV berada jauh di bawah nilai minimum spesifikasi limit sensor yang digunakan.
  - Solusi: Seperti layaknya error `HHHH`, periksa kecocokan tipe sensor, terutama pada rentang skala Analog `L-SC` jika menggunakan input voltase/arus.
- **Tampilan: `ERR`**
  - Penyebab: Gagal ketika berkomunikasi RS485 Sync Master / sinkronisasi nilai ke Slave (berkedip). Dapat juga bermakna password yang diinput untuk memasuki *Lock Menu* salah.
  - Solusi: Cek apakah ID Master & Slave sinkron. Jika lupa password `PWd`, lihat layar untuk membacanya melalui dekripsi dan mintakan bantuan kepada perwakilan Autonics.
- **Tampilan: `TMR.E` / `PTN.E`**
  - Penyebab: Terjadi saat menjalankan fungsi *Timer* (Fixed Control) atau *Program* (Program Control) tetapi pengaturan parameternya belum tuntas (durasi atau SV masih kosong).
  - Solusi: Masuk menu `CNTL` (Timer) atau `PATN` (Program) dan selesaikan seluruh isian durasinya (misal `t.oN`, `Tm□`, dsb).

---

# 18. Factory Reset

Jika controller bertingkah aneh atau salah pengaturan yang merusak, gunakan fungsi *Parameter Reset*.

- **Cara Reset:** 
  Masuk ke grup parameter `ETC`. Temukan menu `INIT`. Ubah isian parameter `NO` menjadi `YES`, lalu tekan tombol `[M]`. 
  *Shortcut Rahasia:* Pada saat berada di RUN Mode, tekan dan tahan tombol panah `[◀]` + `[▲]` + `[▼]` secara bersamaan selama kurang lebih 5 detik hingga muncul parameter reset.
- **Efek Reset:**
  Seluruh konfigurasi alat akan otomatis dikembalikan ke *Default Pabrik* sebagaimana mesin saat pertama kali dibeli.
- **Hal yang perlu diperhatikan:**
  Langkah reset ini **TIDAK AKAN** mengubah pengaturan yang ada pada parameter Komunikasi (`COMM`). Hal ini sangat menolong agar identitas alat dalam jaringan RS485 HMI tidak hilang.

---

# 19. Rekomendasi Konfigurasi

**Skenario 1: Controller Dasar dengan Output Relay (Misalnya, Pemanas Oven Normal)**
- Sensor (`IN-T`): `KCaH` (Gunakan Thermocouple K yang umum dan murah).
- Control output (`O-FT`): `HEAT`
- Control method (`C-MD`): `PID`
- Heating Cycle (`H-T`): **`20.0` Detik.** (*Sangat Penting:* Relay memiliki batas usia pemakaian 100,000 cetekan fisik. Mempercepat siklus akan merusak relay).
- Auto-Tuning: Lakukan Auto-tuning sesudah target SV disetup.

**Skenario 2: Pemanas Super Presisi dengan SSR (Misalnya Mesin Packaging Plastik)**
- Sensor (`IN-T`): `KCaL` (Menggunakan ketelitian presisi koma 0.1°C).
- Control output (`O-FT`): `HEAT`
- Control method (`C-MD`): `PID`
- Heating Cycle (`H-T`): **`2.0` Detik.** (Solid State Relay/SSR bekerja tanpa mekanik fisik sehingga bebas di-switch dengan super cepat. Hal ini membuahkan suhu sangat lurus, nyaris tanpa riak guncangan).

**Skenario 3: Modbus RTU RS485 via PLC / Scada / HMI**
- Kabel: Sambungkan RS485 `A+` dan `B-` memakai *Twisted Pair*.
- Protocol (`COmP`): `RTU`.
- Baudrate (`BPS`): `96` (9600 bps), harus selaras antara PLC master dengan Controller TN.
- Parity (`PRTY`): `NONE`, Stop bit: `2`.
- Address (`AdRS`): Berikan nomor berbeda-beda (misal Mesin A = `01`, Mesin B = `02`, dst). Alat siap di-kueri (*query*) parameter hold registrenya.

---

# 20. Ringkasan Cepat

| Kategori | Solusi/Nilai Panduan Cepat |
|---|---|
| **Tombol Penting** | Tekan `[M]` (2 detik) masuk Setting. Tekan `[◀]` (2 detik) untuk *Back* / Exit. Tekan `[▲]/[▼]` untuk ubah. |
| **Menu Wajib** | `IN` (Atur Input), `CNTL` (Pilih Output & Mode), `PIdC` (Mulai Tuning). |
| **Parameter Kunci** | `IN-T` = Tipe Sensor, `AT` = Auto-tuning, `O-FT` = Heat/Cool, `H-T` = Interval cetekan relay. |
| **Komunikasi Default** | Pin A+/B- (Modbus RTU, 9600 bps, 8 bit, Parity None, 2 Stop bit). |
| **Error** | `OPEN` = Cek kabel sensor. `HHHH`/`LLLL` = Suhu melebihi spesifikasi sensor terpasang. |
| **Wiring** | Suplai Power ada di pin 5, 6 (Untuk TNS) atau 11, 12 (TNH/TNL). JANGAN dipasang ke pin lainnya. |
| **Indikator AT** | Berkedip bila Auto-tuning sedang jalan. Suhu mungkin melonjak sedikit selama belajar (wajar). Tunggu hingga AT OFF. |

---
*Dokumentasi disusun mengacu secara strict dan absolut berdasarkan TN Series Dua-Derajat-Kebebasan (2-DOF) PID Temperature Controllers User Manual V2.1.*
