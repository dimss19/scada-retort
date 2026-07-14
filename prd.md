# PRD — Web-Configurable & Visual SCADA Dashboard (Standalone Web App)

> Single Source of Truth untuk fitur ini. AI tidak boleh berasumsi di luar dokumen ini.
> Jika informasi tidak tersedia, AI harus menandai `TODO/ASUMSI` dan menuliskannya di Section 14, bukan menebak diam-diam.

---

## 0. AI Rules (Guardrail)

```
- Jangan membuat fitur/endpoint di luar scope dokumen ini.
- Project ini berada di folder TERPISAH (d:\laragon\www\retort-scada-web atau sesuai
  nama folder yang dibuat). JANGAN menulis atau mengubah file di d:\laragon\www\project-indah-mesin.
- Gunakan komponen reusable yang sudah disebut di Section 8, jangan buat duplikat.
- Jangan membuat dummy logic/data untuk kode production (mock hanya jika diminta eksplisit).
- Jika ada informasi yang kurang untuk mengambil keputusan → tulis `// TODO: [pertanyaan]` di kode
  dan catat di Section 14 (Assumptions Log), JANGAN diam-diam menebak.
- Ikuti Tech Stack & Coding Convention di Section 2 secara ketat, jangan improvisasi library baru.
- Project ini TERPISAH dari project-indah-mesin. Jangan campur kode atau database.
```

---

## 1. Ringkasan & Scope

```
Nama Fitur     : Web-Configurable & Visual SCADA Dashboard
Jenis Project  : Web application BARU, standalone, folder TERPISAH dari project-indah-mesin.
                  Project-indah-mesin TIDAK akan terpengaruh sama sekali.
Folder Project : d:\laragon\www\retort-scada-web (atau nama lain yang dipilih saat init)
Repo           : Repository git sendiri, independen
Tujuan Bisnis  : Menyediakan platform web terpusat untuk:
                  (1) Mengkonfigurasi pin I/O dan modul ESP32 tanpa flash manual
                  (2) Melakukan OTA firmware update melalui browser
                  (3) Menampilkan visualisasi SCADA real-time dari proses retort
                  Platform ini menggantikan kebutuhan mengakses embedded web ESP32 secara
                  langsung untuk konfigurasi — cukup satu web app untuk mengelola semua
                  device RetortLogger dari jarak jauh.

Arsitektur Tingkat Tinggi:
  ┌──────────┐    HTTP/WS     ┌──────────────┐     MQTT      ┌──────────┐
  │ Browser  │ ◄────────────► │ Laravel App  │ ◄───────────► │  ESP32   │
  │ (React)  │   Inertia.js   │ + Reverb     │  Mosquitto    │ Retort   │
  └──────────┘                └──────────────┘               └──────────┘
                                    │
                                    ▼
                              ┌──────────┐
                              │PostgreSQL│
                              └──────────┘

IN SCOPE:
  1. Dynamic Pin & Feature Configuration
     - UI web (React) untuk assign pin I/O ESP32-S3 ke fungsi tertentu
     - Toggle enable/disable per modul (Simulasi, Modbus, MQTT, SD, RTC)
     - Konfigurasi disimpan di database Laravel, dikirim ke ESP32 via MQTT
     - ESP32 menerima, menyimpan ke NVS, lalu reboot untuk apply
  2. Web-Based OTA Flashing
     - Upload file firmware .bin ke Laravel server
     - Laravel mengirim notifikasi ke ESP32 via MQTT bahwa firmware baru tersedia
     - ESP32 mengunduh .bin dari endpoint Laravel lalu flash sendiri (pull model)
     - Progress & status dilaporkan ESP32 kembali via MQTT
  3. SCADA Visual Dashboard
     - Representasi grafis alur proses retort (pipa, tangki, katup, ruang pemanas)
     - Data real-time dari ESP32 via MQTT → Laravel Reverb (WebSocket) → browser
     - Animasi elemen visual sesuai status (warna pipa, indikator valve, suhu)
  4. Device Registry
     - Daftar semua device ESP32/RetortLogger yang terdaftar
     - Status online/offline per device
     - Riwayat konfigurasi dan firmware per device

OUT OF SCOPE:
  - Perubahan firmware RetortLogger yang sudah ada (akuisisi Modbus, SD logging, dll)
  - Menggantikan project-indah-mesin (project lama tetap jalan terpisah)
  - Autentikasi ESP32 ke broker MQTT (pakai kredensial existing)
  - Multi-tenant (satu instance web = satu pabrik/lokasi)
```

---

## 2. Tech Stack & Coding Convention

```
Backend          : Laravel 11+ (PHP 8.2+)
Frontend         : React 18+ via Inertia.js (SPA feel, server-side routing)
Real-time        : Laravel Reverb (WebSocket server bawaan Laravel) + Laravel Echo (client)
CSS              : Tailwind CSS 4
Database         : PostgreSQL
MQTT Client      : Laravel berkomunikasi ke Mosquitto broker via php-mqtt/client (publish
                   command ke ESP32) dan worker daemon (subscribe data dari ESP32)
File Storage     : Laravel Storage (local disk) untuk file .bin firmware
Auth             : Laravel Breeze (session-based, single guard)
Build Tool       : Vite (bawaan Laravel)
Testing          : PHPUnit (backend) + Vitest/React Testing Library (frontend)
Naming Convention:
  - Backend  : PSR-12, Laravel convention (snake_case DB, camelCase method)
  - Frontend : camelCase variabel, PascalCase komponen React
  - MQTT Topics : kebab-case (retort/config/push, retort/ota/notify, dll)
Library baru     : Hanya yang tercantum di atas. Tambahan harus dikonfirmasi eksplisit.
```

---

## 3. User Roles & Permission

```
Menggunakan Laravel Breeze dengan Single Guard (satu tipe user).
Hanya ada dua state: Guest (belum login) dan Authenticated User (sudah login).

| Aksi                            | Guest | Authenticated User |
|---------------------------------|-------|---------------------|
| View SCADA Dashboard            | ✗     | ✓                   |
| View Device List                | ✗     | ✓                   |
| View/Edit Pin & Feature Config  | ✗     | ✓                   |
| Upload & Trigger OTA            | ✗     | ✓                   |
| Register/Remove Device          | ✗     | ✓                   |

Catatan: Ini adalah aplikasi internal pabrik (bukan SaaS publik).
Satu login = akses penuh ke semua device yang terdaftar.
```

---

## 4. User Story & Skenario (Given-When-Then)

```
--- Device Registration ---
Sebagai teknisi
Saya ingin mendaftarkan device ESP32 baru ke web app
Supaya device tersebut bisa dikonfigurasi dan dimonitor dari dashboard

Skenario 1 (sukses):
  Given teknisi login dan membuka halaman Device,
  When teknisi menambahkan device baru (machine_code, nama, broker MQTT),
  Then device tersimpan di database dan muncul di daftar device (status: offline
       sampai ESP32 mengirim heartbeat pertamanya).

--- Dynamic Configuration ---
Sebagai teknisi
Saya ingin mengatur alokasi pin I/O dan modul ESP32 lewat Web UI
Supaya saya tidak perlu membongkar panel atau flash ulang via Arduino IDE

Skenario 1 (sukses):
  Given teknisi login dan memilih device dari daftar,
  When teknisi mengubah pin Modbus RX/TX dan menyimpan,
  Then konfigurasi tersimpan di database, Laravel publish MQTT command
       `retort/config/push` ke device, ESP32 menerima → simpan NVS → reboot,
       lalu melaporkan status baru via MQTT.

Skenario 2 (gagal - konflik pin):
  Given teknisi memilih pin yang sudah dipakai fungsi lain,
  When teknisi menyimpan,
  Then validasi Laravel menolak dengan pesan error konflik pin (HTTP 422),
       konfigurasi lama tetap dipakai.

Skenario 3 (edge - device offline saat push config):
  Given device ESP32 sedang offline,
  When teknisi menyimpan konfigurasi baru,
  Then konfigurasi tersimpan di database (pending), dan akan di-push ulang
       saat device kembali online (retained MQTT message atau sync saat boot).

Skenario 4 (edge - proses retort sedang RUN):
  Given proses retort sedang berjalan pada device (status RUN),
  When teknisi mencoba mengubah konfigurasi pin/modul,
  Then sistem menolak perubahan: "Tidak bisa ubah konfigurasi saat proses berjalan".
       Perubahan DIBLOKIR selama status RUN untuk menjaga integritas logging.

--- Web-Based OTA ---
Sebagai teknisi
Saya ingin mengunggah firmware baru dan mendorong update ke device tertentu
Supaya saya bisa update firmware tanpa kabel USB atau akses fisik ke mesin

Skenario 1 (sukses):
  Given teknisi di halaman OTA, memilih device target,
  When teknisi upload file .bin valid dan klik "Push Update",
  Then Laravel menyimpan file, publish MQTT notifikasi ke device, ESP32
       mengunduh .bin dari endpoint Laravel (`GET /api/ota/firmware/{id}`),
       flash ke partisi OTA, lalu reboot. Status progress dilaporkan via MQTT
       dan ditampilkan real-time di web.

Skenario 2 (gagal - file tidak valid):
  Given teknisi upload file bukan .bin atau ukuran > 1.5 MB,
  When validasi Laravel berjalan,
  Then upload ditolak sebelum disimpan, pesan error jelas ditampilkan.

Skenario 3 (edge - flashing gagal / power loss):
  Given ESP32 sedang proses flashing,
  When terjadi error atau mati lampu,
  Then ESP32 boot dari partisi lama (dual-partition OTA bawaan ESP32, aman).
       Status di web berubah menjadi "Failed/Rollback".

--- SCADA Visual Dashboard ---
Sebagai operator
Saya ingin melihat representasi visual dari alur proses retort
Supaya saya bisa memantau status mesin secara intuitif

Skenario 1 (sukses):
  Given operator membuka halaman SCADA dan memilih device,
  When data sensor terbaru masuk via MQTT,
  Then Laravel Reverb mem-broadcast ke browser via WebSocket, elemen visual
       (pipa, katup, ruang pemanas) update warna/animasi real-time tanpa reload.

Skenario 2 (gagal - data stale):
  Given device tidak mengirim data selama > 10 detik,
  Then elemen visual menampilkan indikator "stale/offline" (abu-abu + ikon warning).

Skenario 3 (edge - banyak device):
  Given operator memantau beberapa device sekaligus,
  When data masuk dari multiple device,
  Then setiap SCADA panel hanya menampilkan data device yang dipilih (channel
       WebSocket terpisah per device).
```

---

## 5. Functional Requirements & Field Validation

```
FR-1 : Halaman Device menampilkan daftar semua device terdaftar beserta status
       online/offline, firmware version, dan last seen timestamp.
FR-2 : Halaman Config menampilkan daftar pin yang tersedia (dropdown, bukan free text)
       beserta fungsi yang bisa di-assign, spesifik per device yang dipilih.
FR-3 : Validasi konflik pin dilakukan di sisi Laravel (server-side) sebelum
       menyimpan — satu pin fisik tidak boleh dipakai lebih dari satu fungsi aktif.
FR-4 : Toggle enable/disable modul (Simulasi, Modbus, MQTT, SD, RTC) disimpan
       per device di database.
FR-5 : Halaman OTA menampilkan firmware version saat ini (dari device) dan daftar
       firmware yang tersedia di server. Validasi file sebelum tombol "Push" aktif.
FR-6 : Progress OTA ditampilkan real-time (ESP32 melaporkan persentase via MQTT,
       Laravel broadcast via Reverb ke browser).
FR-7 : SCADA Dashboard menerima data via WebSocket (Laravel Reverb/Echo), bukan
       polling — lebih efisien dan real-time.
FR-8 : Setiap elemen visual SCADA di-mapping ke field data spesifik
       (PV/SV/MV/status) — mapping disimpan per device di database.

| Field (Config)          | Tipe    | Wajib | Validasi                                        | Pesan Error                              |
|--------------------------|---------|-------|-------------------------------------------------|------------------------------------------|
| machine_code             | string  | Y     | unik, alfanumerik + dash, maks 20 char          | "Kode mesin sudah terdaftar"             |
| pin_function             | enum    | Y     | harus dari daftar fungsi valid                  | "Fungsi pin tidak valid"                 |
| gpio_pin                 | integer | Y     | 0-48 (range GPIO ESP32-S3), tidak duplikat      | "Pin sudah digunakan fungsi lain"        |
| feature_toggle           | boolean | Y     | true/false                                      | N/A                                      |
| ota_file                 | file    | Y     | ekstensi .bin, maks 1.5 MB                      | "File harus .bin, maks 1.5 MB"           |
```

---

## 6. Data Model

```
devices
- id: bigint PK
- machine_code: string UNIQUE (mis. "RT-001")
- name: string (mis. "Retort Lantai 2")
- mqtt_broker: string
- mqtt_port: integer DEFAULT 1883
- firmware_version: string NULLABLE
- is_online: boolean DEFAULT false
- last_seen_at: timestamp NULLABLE
- created_at / updated_at: timestamps

pin_configs
- id: bigint PK
- device_id: bigint FK → devices
- function: enum (RS485_RX, RS485_TX, DI1_TRIGGER, SD_CS, SD_MOSI, SD_CLK,
  SD_MISO, RTC_SDA, RTC_SCL)
- gpio_pin: integer
- is_active: boolean DEFAULT true
- UNIQUE constraint: (device_id, gpio_pin) — satu pin per device tidak boleh ganda
- created_at / updated_at: timestamps

feature_configs
- id: bigint PK
- device_id: bigint FK → devices
- module_name: enum (modbus, fake_sensor, mqtt, sd_logger, rtc, ota, mv_simulation)
- enabled: boolean DEFAULT false
- created_at / updated_at: timestamps

firmware_files
- id: bigint PK
- filename: string
- version: string
- file_path: string (Laravel Storage path)
- file_size: integer (bytes)
- checksum_md5: string
- uploaded_by: bigint FK → users NULLABLE
- created_at / updated_at: timestamps

ota_deployments
- id: bigint PK
- device_id: bigint FK → devices
- firmware_file_id: bigint FK → firmware_files
- status: enum (pending, downloading, flashing, success, failed, rollback)
- progress: integer DEFAULT 0 (0-100)
- started_at: timestamp NULLABLE
- completed_at: timestamp NULLABLE
- error_message: text NULLABLE
- created_at / updated_at: timestamps

scada_mappings
- id: bigint PK
- device_id: bigint FK → devices
- element_id: string (mis. "pipa_utama", "valve_1", "ruang_pemanas")
- data_source: string (field: pv, sv, mv, status_run, phase)
- normal_color: string DEFAULT "#22c55e"
- warning_color: string DEFAULT "#eab308"
- critical_color: string DEFAULT "#ef4444"
- warning_threshold: float NULLABLE
- critical_threshold: float NULLABLE
- created_at / updated_at: timestamps

users (Laravel Breeze default)
- id, name, email, password, timestamps
```

---

## 7. API Contract

```
--- Device Management ---
GET    /devices                        → DeviceController@index (Inertia page)
GET    /devices/create                 → DeviceController@create (Inertia page)
POST   /devices                        → DeviceController@store
GET    /devices/{device}               → DeviceController@show (Inertia page)
DELETE /devices/{device}               → DeviceController@destroy

--- Pin & Feature Config ---
GET    /devices/{device}/config        → ConfigController@edit (Inertia page)
PUT    /devices/{device}/config/pins   → ConfigController@updatePins
PUT    /devices/{device}/config/features → ConfigController@updateFeatures
  → Setelah save: Laravel publish MQTT `retort/{machine_code}/config/push` dengan
    payload JSON berisi seluruh konfigurasi pin + feature terbaru.
  → Response 422 jika konflik pin atau proses sedang RUN.

--- OTA ---
GET    /ota                            → OtaController@index (Inertia page, daftar firmware)
POST   /ota/firmware                   → OtaController@uploadFirmware (upload .bin)
POST   /ota/deploy                     → OtaController@deploy (push ke device tertentu)
  → Laravel publish MQTT `retort/{machine_code}/ota/notify` dengan URL download.
GET    /api/ota/firmware/{id}/download → OtaController@download (endpoint publik untuk
                                         ESP32 mengunduh file .bin via HTTP)

--- SCADA ---
GET    /scada/{device}                 → ScadaController@show (Inertia page)
GET    /devices/{device}/scada/config  → ScadaController@editMapping (Inertia page)
PUT    /devices/{device}/scada/config  → ScadaController@updateMapping

--- WebSocket Channels (Laravel Reverb) ---
Channel: retort.{machineCode}
  Event: SensorDataReceived  → { pv, sv, mv, phase, run, logging, iso, ... }
  Event: OtaProgressUpdated  → { status, progress, error_message }
  Event: DeviceStatusChanged → { is_online, last_seen_at }

--- MQTT Topics (Laravel ↔ ESP32) ---
Subscribe (Laravel listens):
  retort/data                 → data sensor real-time dari ESP32 (existing)
  retort/{machine_code}/ota/status → progress OTA dari ESP32
  retort/{machine_code}/config/ack → konfirmasi config diterima ESP32

Publish (Laravel sends):
  retort/{machine_code}/config/push → kirim konfigurasi baru ke ESP32
  retort/{machine_code}/ota/notify  → beritahu ESP32 ada firmware baru + URL download
```

---

## 8. UI, State & Reusable Components

```
Halaman utama (Inertia pages):
  /login                  → Login (Laravel Breeze)
  /dashboard              → Overview: daftar device + status ringkas
  /devices                → Device registry (CRUD)
  /devices/{id}/config    → Pin & Feature config per device
  /ota                    → Firmware management + deploy
  /scada/{id}             → SCADA visual dashboard per device

Referensi visual SCADA : Inline SVG yang di-render React — menggambarkan skema
                         sederhana: tangki retort, pipa input/output, katup, sensor.
                         Setiap elemen SVG memiliki ID unik yang di-mapping ke
                         data_source via scada_mappings table.

Loading state     : Skeleton loader pada SCADA saat WebSocket belum connected;
                    progress bar pada halaman OTA saat upload/deploy.
Empty state       : "Belum ada device terdaftar" di halaman devices.
                    "Belum ada firmware" di halaman OTA.
Error state       : Toast notification untuk error (konflik pin, upload gagal, dll).
                    Badge "offline" pada device card jika last_seen > 10 detik.
Success state     : Toast + redirect setelah simpan config berhasil.
                    Status "Success" + timestamp di OTA deployment list.
Responsive        : Wajib responsif (mobile/tablet/desktop), dark mode.

Komponen React reusable:
  <DeviceCard />           → kartu ringkas per device (status, temp, phase)
  <PinConfigForm />        → form dynamic untuk assign pin ke fungsi
  <FeatureToggleGroup />   → group of toggles untuk enable/disable modul
  <OtaUploadForm />        → upload .bin + validasi client-side
  <OtaDeployStatus />      → progress bar + status text (listen WebSocket)
  <ScadaCanvas />          → container SVG utama untuk SCADA visual
  <ScadaElement />         → komponen generik per elemen visual (pipa/valve/tangki)
                              menerima props: data_source, value, thresholds, colors
  <DeviceSelector />       → dropdown/sidebar pilih device aktif
  <StatusBadge />          → badge online/offline/stale
```

---

## 9. Business Rules

```
Rule 1: IF pin yang dipilih sudah aktif dipakai fungsi lain pada device yang sama
        THEN tolak penyimpanan dan tampilkan error konflik (HTTP 422).
Rule 2: IF proses retort sedang RUN pada device THEN konfigurasi pin/modul DIBLOKIR.
        Sistem menampilkan peringatan dan menolak penyimpanan.
Rule 3: IF proses OTA flashing gagal THEN ESP32 rollback otomatis ke firmware lama
        (dual-partition bawaan ESP32). Status di web berubah ke "failed/rollback".
Rule 4: IF device tidak mengirim data > 10 detik THEN status berubah ke "offline/stale"
        dan elemen SCADA menampilkan indikator visual (abu-abu + warning icon).
Rule 5: IF modul dinonaktifkan pada device THEN elemen SCADA yang bergantung pada
        modul tersebut disembunyikan dari tampilan.
Rule 6: IF device offline saat config di-push THEN konfigurasi tetap tersimpan di
        database (pending) dan akan di-push ulang saat device kembali online
        (MQTT retained message).
Rule 7: Hanya satu proses OTA deployment aktif per device dalam satu waktu.
```

---

## 10. Edge Cases & Error Handling

```
- Double submit config / double upload OTA  : tombol disabled + debounce setelah klik,
  satu proses OTA per device.
- MQTT broker down                          : Laravel menampilkan warning "Broker tidak
  tersedia", config tetap tersimpan di DB tapi belum ter-push.
- ESP32 tidak merespons config push         : timeout 30 detik, status "pending" tetap
  ditampilkan, bisa di-retry manual.
- Token/session expired                     : redirect ke login (Laravel Breeze default).
- Power loss saat OTA di ESP32              : Aman — dual-partition OTA bawaan ESP32.
  Device boot dari partisi lama.
- Pin reserved (SD: 10-13, RTC: 8-9)       : pin ini ada di daftar tapi ditandai
  "reserved" dan tidak bisa di-reassign ke fungsi lain.
- Banyak device kirim data bersamaan        : Laravel worker memproses antrian,
  Reverb broadcast per channel (tidak campur antar device).
- File .bin corrupt                         : ESP32 Update.h otomatis validasi MD5 +
  magic bytes. Jika gagal, flash dibatalkan, boot dari partisi lama.
```

---

## 11. Non-Functional (Security & Performance)

```
Security    : - Semua route dilindungi middleware auth (Laravel Breeze).
              - File .bin firmware disimpan di storage private (tidak publicly accessible),
                endpoint download untuk ESP32 menggunakan signed URL atau token.
              - MQTT credentials tidak di-expose ke frontend.
              - CSRF protection pada semua form (Inertia.js default).
              - Input validation server-side pada semua endpoint (FormRequest classes).

Performance : - WebSocket (Reverb) untuk data real-time, bukan polling — lebih efisien.
              - MQTT worker sebagai daemon (artisan command) yang selalu running,
                bukan dipanggil per-request.
              - SCADA SVG ringan (inline, tanpa external asset besar).
              - Database indexing pada: devices.machine_code, pin_configs.device_id,
                ota_deployments.device_id + status.
              - Pagination pada daftar device dan firmware jika jumlah besar.

Scalability : - Satu instance web app per lokasi pabrik (bukan multi-tenant).
              - Kapasitas target: ≤ 50 device per instance.
```

---

## 12. Testing Requirements

```
Backend (PHPUnit):
  - Unit test: validasi konflik pin, validasi file .bin (ukuran, ekstensi)
  - Feature test: CRUD device, push config via MQTT (mock), OTA upload + deploy flow
  - Test MQTT publish payload format (mock mqtt client)

Frontend (Vitest + React Testing Library):
  - Component test: PinConfigForm, FeatureToggleGroup, OtaUploadForm
  - SCADA rendering: elemen berubah warna sesuai props threshold

Integration / Manual:
  - End-to-end: config push → ESP32 terima → reboot → data baru masuk via MQTT
  - OTA: upload → deploy → ESP32 download → flash → reboot → version baru dilaporkan
  - SCADA real-time: data MQTT masuk → Reverb broadcast → browser update tanpa reload
  - Simulasi device offline → SCADA menampilkan stale indicator
```

---

## 13. Definition of Done

```
- [ ] Project Laravel baru berhasil dibuat dan berjalan di Laragon
- [ ] Device CRUD (register, list, detail, delete) berfungsi
- [ ] Konfigurasi pin & modul tersimpan di DB dan ter-push ke ESP32 via MQTT
- [ ] Validasi konflik pin dan blokir saat RUN berfungsi
- [ ] Upload firmware .bin, deploy ke device, ESP32 berhasil flash + reboot
- [ ] SCADA Dashboard menampilkan visual real-time via WebSocket (Reverb)
- [ ] Indikator stale/offline muncul saat device tidak kirim data > 10 detik
- [ ] Semua route dilindungi auth, CSRF aktif, input tervalidasi server-side
- [ ] Responsive di mobile/tablet/desktop, dark mode
- [ ] Test backend (PHPUnit) dan frontend (Vitest) passing
```

---

## 14. Assumptions Log (RESOLVED)

```
Semua poin di bawah ini sudah TERJAWAB berdasarkan investigasi dan keputusan desain.
AI coding agent wajib mengikuti jawaban ini sebagai fakta, bukan asumsi:

1. **Jenis project:** Web app BARU, folder dan repo TERPISAH dari project-indah-mesin.
   Path: `d:\laragon\www\retort-scada-web` (atau nama folder lain sesuai pilihan user).
   Project-indah-mesin tidak akan disentuh.
2. **Framework:** Laravel 11+ (backend) + React 18+ via Inertia.js (frontend).
3. **Real-time:** Laravel Reverb (WebSocket), bukan polling. Data dari ESP32 masuk
   via MQTT → Laravel worker → broadcast ke browser via Reverb channel.
4. **Komunikasi ke ESP32:** MQTT (publish command, subscribe data). ESP32 tidak
   perlu diubah secara fundamental — hanya perlu menambah handler untuk topic
   config/push dan ota/notify.
5. **OTA model:** Pull — Laravel menyimpan .bin, ESP32 mengunduh dari endpoint
   Laravel via HTTP setelah menerima notifikasi MQTT.
6. **Auth:** Laravel Breeze, single guard, session-based. Satu login = akses penuh.
7. **Pin reserved:** GPIO 8,9 (RTC I2C) dan 10,11,12,13 (SD SPI) tidak boleh
   di-reassign. Ditandai "reserved" di UI.
8. **Reboot setelah config:** Wajib. ESP32 harus reboot setelah terima config baru
   agar hardware re-init di setup().
9. **Blokir config saat RUN:** Ya, diblokir total (bukan warning saja).
10. **Stale threshold:** 10 detik tanpa data = offline/stale.
11. **Modul dinonaktifkan:** Elemen SCADA terkait disembunyikan.
12. **Batas .bin:** Maksimal 1.5 MB.
13. **SCADA visual:** Inline SVG di-render React, tanpa external image asset.
14. **Kapasitas:** Target ≤ 50 device per instance web app.
```
