# Workflow Eksekusi untuk AI Agent: Web-Configurable & Visual SCADA Dashboard

> Dokumen ini dipasangkan dengan PRD (lihat: [prd.md](file:///d:/laragon/www/scadaretort/prd.md)).
> PRD menjawab "apa yang dibangun". Dokumen ini mengatur "urutan dan cara AI mengerjakannya"
> agar AI tidak overbuild, tidak melompat langkah, dan tidak menebak diam-diam saat stuck.

---

## Aturan Eksekusi (WAJIB dibaca AI sebelum mulai)

```
1. AI mengerjakan MAKSIMAL 1 fase per giliran, lalu BERHENTI.
   Jangan lanjut ke fase berikutnya tanpa konfirmasi dari user.

2. Jika di tengah fase menemukan informasi yang kurang atau ambigu:
   → BERHENTI, tulis pertanyaan spesifik ke user.
   → JANGAN lanjut mengerjakan dengan menebak.
   → Jika ambiguitas kecil dan sudah diizinkan di PRD Section 14 (Assumptions Log),
     boleh lanjut tapi WAJIB disebutkan asumsi yang dipakai.

3. Di akhir setiap fase, AI WAJIB melaporkan dalam format ini:
   - File yang dibuat/diubah: [daftar path file]
   - Checklist yang selesai: [nomor]
   - Checklist yang BELUM tercapai / butuh review: [nomor + alasan]
   - Pertanyaan terbuka (jika ada): [daftar]

4. AI tidak boleh mengubah file di luar scope fase yang sedang dikerjakan,
   kecuali file tersebut memang perlu diubah sesuai PRD (misal: menambah route baru
   di file routing utama).

5. Jika satu checklist item terasa terlalu besar untuk 1 langkah (misal "buat halaman
   dengan semua state"), AI boleh memecahnya jadi sub-langkah kecil di responsnya,
   tapi tetap dalam 1 fase yang sama — jangan diam-diam meluas ke fase lain.

6. Project ini berada di: d:\laragon\www\scadaretort
   JANGAN menulis atau mengubah file di project-indah-mesin atau folder lain.

7. Tech stack WAJIB mengikuti PRD Section 2. Jangan improvisasi library baru.
```

---

## Konteks Project Saat Ini (Hasil Analisis)

```
Status         : Laravel 13 fresh install (via Laragon)
Database       : SQLite (default) — HARUS migrasi ke PostgreSQL sesuai PRD
Frontend       : Belum ada React/Inertia — hanya Vite + Tailwind CSS 4
Auth           : Belum ada Laravel Breeze
Real-time      : Belum ada Laravel Reverb
MQTT           : Belum ada php-mqtt/client
Existing Models: Hanya User.php (default Laravel)
Migrations     : Hanya default Laravel (users, cache, jobs)
Routes         : Hanya default welcome route

Package yang perlu di-install di Fase 1:
  Backend  : laravel/breeze (Inertia+React stack), laravel/reverb, php-mqtt/laravel-client
  Frontend : @inertiajs/react, react, react-dom, laravel-echo, pusher-js
  Testing  : vitest, @testing-library/react, @testing-library/jest-dom
```

---

## Fase 1: Persiapan & Fondasi

**Tujuan:** Menyiapkan seluruh infrastruktur project agar siap untuk development fitur.

### 1.1 — Install & Konfigurasi Dependency

```
[ ] 1.1.1 Install Laravel Breeze dengan stack Inertia + React
        → php artisan breeze:install react --typescript
        → Ini akan menginstall React 18+, Inertia.js, dan setup auth pages otomatis
[ ] 1.1.2 Install Laravel Reverb (WebSocket server)
        → php artisan install:broadcasting
        → Konfigurasi .env: BROADCAST_CONNECTION=reverb, REVERB_* variables
[ ] 1.1.3 Install php-mqtt/laravel-client untuk komunikasi ke Mosquitto broker
        → composer require php-mqtt/laravel-client
        → Konfigurasi .env: MQTT_HOST, MQTT_PORT, MQTT_USERNAME, MQTT_PASSWORD
[ ] 1.1.4 Ubah database dari SQLite ke PostgreSQL
        → Update .env: DB_CONNECTION=pgsql, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD
        → Pastikan PostgreSQL server sudah running di Laragon
[ ] 1.1.5 Install testing dependencies frontend
        → npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
        → Konfigurasi vitest di vite.config.js
[ ] 1.1.6 Jalankan npm install dan pastikan build berhasil (npm run build)
```

### 1.2 — Buat Migration & Data Model (PRD Section 6)

```
[ ] 1.2.1 Migration: create_devices_table
        Kolom: id, machine_code (string UNIQUE), name, mqtt_broker, mqtt_port (default 1883),
        firmware_version (nullable), is_online (default false), last_seen_at (nullable timestamp),
        timestamps

[ ] 1.2.2 Migration: create_pin_configs_table
        Kolom: id, device_id (FK → devices), function (enum: RS485_RX, RS485_TX,
        DI1_TRIGGER, SD_CS, SD_MOSI, SD_CLK, SD_MISO, RTC_SDA, RTC_SCL),
        gpio_pin (integer), is_active (default true), timestamps
        UNIQUE constraint: (device_id, gpio_pin)

[ ] 1.2.3 Migration: create_feature_configs_table
        Kolom: id, device_id (FK → devices), module_name (enum: modbus, fake_sensor,
        mqtt, sd_logger, rtc, ota, mv_simulation), enabled (default false), timestamps

[ ] 1.2.4 Migration: create_firmware_files_table
        Kolom: id, filename, version, file_path, file_size (integer, bytes),
        checksum_md5, uploaded_by (FK → users, nullable), timestamps

[ ] 1.2.5 Migration: create_ota_deployments_table
        Kolom: id, device_id (FK → devices), firmware_file_id (FK → firmware_files),
        status (enum: pending, downloading, flashing, success, failed, rollback),
        progress (integer, default 0, range 0-100), started_at (nullable),
        completed_at (nullable), error_message (text, nullable), timestamps

[ ] 1.2.6 Migration: create_scada_mappings_table
        Kolom: id, device_id (FK → devices), element_id (string),
        data_source (string), normal_color (default #22c55e),
        warning_color (default #eab308), critical_color (default #ef4444),
        warning_threshold (float nullable), critical_threshold (float nullable), timestamps

[ ] 1.2.7 Jalankan php artisan migrate — pastikan semua migration sukses
```

### 1.3 — Buat Eloquent Models (PRD Section 6)

```
[ ] 1.3.1 Model: Device
        - fillable, casts, relationships: hasMany(PinConfig), hasMany(FeatureConfig),
          hasMany(OtaDeployment), hasMany(ScadaMapping)

[ ] 1.3.2 Model: PinConfig
        - fillable, casts (function → enum), relationship: belongsTo(Device)
        - Enum class: PinFunction (RS485_RX, RS485_TX, DI1_TRIGGER, SD_CS, SD_MOSI,
          SD_CLK, SD_MISO, RTC_SDA, RTC_SCL)

[ ] 1.3.3 Model: FeatureConfig
        - fillable, casts (module_name → enum), relationship: belongsTo(Device)
        - Enum class: ModuleName (modbus, fake_sensor, mqtt, sd_logger, rtc, ota, mv_simulation)

[ ] 1.3.4 Model: FirmwareFile
        - fillable, casts, relationships: belongsTo(User, uploaded_by), hasMany(OtaDeployment)

[ ] 1.3.5 Model: OtaDeployment
        - fillable, casts (status → enum), relationships: belongsTo(Device), belongsTo(FirmwareFile)
        - Enum class: OtaStatus (pending, downloading, flashing, success, failed, rollback)

[ ] 1.3.6 Model: ScadaMapping
        - fillable, casts, relationship: belongsTo(Device)
```

### 1.4 — Definisikan TypeScript Interfaces (PRD Section 6 & 7)

```
[ ] 1.4.1 types/device.ts
        → Interface: Device, DeviceFormData

[ ] 1.4.2 types/pin-config.ts
        → Interface: PinConfig, PinFunction (enum), PinConfigFormData

[ ] 1.4.3 types/feature-config.ts
        → Interface: FeatureConfig, ModuleName (enum)

[ ] 1.4.4 types/firmware.ts
        → Interface: FirmwareFile, OtaDeployment, OtaStatus (enum), OtaDeployFormData

[ ] 1.4.5 types/scada.ts
        → Interface: ScadaMapping, ScadaMappingFormData, SensorData
          (SensorData: { pv, sv, mv, phase, run, logging, iso, ... })

[ ] 1.4.6 types/index.ts
        → Barrel export semua types
```

### 1.5 — Setup Routing & Controller Skeleton (PRD Section 7)

```
[ ] 1.5.1 Buat routes di routes/web.php sesuai API Contract:
        - Device routes: GET/POST /devices, GET /devices/create, GET /devices/{device},
          DELETE /devices/{device}
        - Config routes: GET /devices/{device}/config,
          PUT /devices/{device}/config/pins, PUT /devices/{device}/config/features
        - OTA routes: GET /ota, POST /ota/firmware, POST /ota/deploy
        - SCADA routes: GET /scada/{device}, GET /devices/{device}/scada/config,
          PUT /devices/{device}/scada/config
        - API route: GET /api/ota/firmware/{id}/download (untuk ESP32)
        → Semua route (kecuali API download) dilindungi middleware auth

[ ] 1.5.2 Buat Controller skeleton (method kosong, return Inertia::render placeholder):
        - DeviceController (index, create, store, show, destroy)
        - ConfigController (edit, updatePins, updateFeatures)
        - OtaController (index, uploadFirmware, deploy, download)
        - ScadaController (show, editMapping, updateMapping)

[ ] 1.5.3 Buat FormRequest classes untuk validasi server-side:
        - StoreDeviceRequest (machine_code: required|unique|alpha_dash|max:20, name: required, dll)
        - UpdatePinConfigRequest (validasi konflik pin, range GPIO 0-48)
        - UpdateFeatureConfigRequest
        - UploadFirmwareRequest (file: required|file|mimes:bin|max:1536 [1.5MB])
        - DeployOtaRequest
        - UpdateScadaMappingRequest
```

### 1.6 — Setup WebSocket & Event Broadcasting (PRD Section 7)

```
[ ] 1.6.1 Buat Event classes:
        - SensorDataReceived (broadcastOn: retort.{machineCode})
        - OtaProgressUpdated (broadcastOn: retort.{machineCode})
        - DeviceStatusChanged (broadcastOn: retort.{machineCode})

[ ] 1.6.2 Konfigurasi channel authorization di routes/channels.php
        → Private channel: retort.{machineCode}

[ ] 1.6.3 Setup Laravel Echo di frontend (resources/js/echo.ts atau bootstrap.ts)
```

### 1.7 — Setup MQTT Worker (PRD Section 7 & 11)

```
[ ] 1.7.1 Buat Artisan Console Command: MqttSubscribeCommand
        - Subscribe ke topics:
          retort/data (data sensor real-time)
          retort/{machine_code}/ota/status (progress OTA)
          retort/{machine_code}/config/ack (konfirmasi config)
        - Daemon mode (selalu running)

[ ] 1.7.2 Buat MQTT Service class (app/Services/MqttService.php):
        - Method: publishConfig(Device $device, array $config)
          → Publish ke: retort/{machine_code}/config/push
        - Method: publishOtaNotify(Device $device, string $downloadUrl)
          → Publish ke: retort/{machine_code}/ota/notify
```

**Stop condition:** Setelah Fase 1 selesai, laporkan:
- Daftar semua migration, model, type interface, controller, dan event yang dibuat
- Hasil `php artisan migrate` (sukses/gagal)
- Hasil `npm run build` (sukses/gagal)
- Pertanyaan terbuka (jika ada)

**Ini fondasi yang paling murah untuk dikoreksi sekarang, paling mahal kalau dikoreksi di Fase 3+.**

---

## Fase 2: Komponen Atomik & Molekul (React)

**Tujuan:** Membuat semua komponen reusable React (PRD Section 8) secara terisolasi,
beserta unit test-nya, sebelum diintegrasikan ke halaman penuh.

### 2.1 — Buat Komponen Reusable (PRD Section 8)

```
[ ] 2.1.1 <StatusBadge />
        Props: status ('online' | 'offline' | 'stale'), size?
        Render: badge berwarna dengan teks status
        - Online: hijau, Offline: abu-abu, Stale: kuning + warning icon

[ ] 2.1.2 <DeviceCard />
        Props: device (Device), onClick?
        Render: kartu ringkas per device — machine_code, name, firmware_version,
        last_seen_at, StatusBadge, suhu/phase (jika data real-time tersedia)

[ ] 2.1.3 <DeviceSelector />
        Props: devices (Device[]), selectedId, onChange
        Render: dropdown atau sidebar untuk memilih device aktif

[ ] 2.1.4 <PinConfigForm />
        Props: device (Device), pinConfigs (PinConfig[]), onSubmit, errors
        Render: form dynamic — setiap baris: dropdown fungsi + dropdown GPIO pin
        - GPIO range: 0-48 (ESP32-S3)
        - Pin reserved (8,9 = RTC I2C; 10,11,12,13 = SD SPI) ditandai "reserved"
        - Validasi client-side: pin tidak boleh duplikat di dalam form
        - Disabled state jika device sedang RUN

[ ] 2.1.5 <FeatureToggleGroup />
        Props: device (Device), featureConfigs (FeatureConfig[]), onToggle, disabled?
        Render: group of toggle switches per modul (modbus, fake_sensor, mqtt,
        sd_logger, rtc, ota, mv_simulation) — label + deskripsi singkat + toggle
        - Disabled state jika device sedang RUN

[ ] 2.1.6 <OtaUploadForm />
        Props: onUpload, isUploading
        Render: drag-and-drop zone atau file input, validasi client-side:
        - Hanya file .bin
        - Maksimal 1.5 MB
        - Tampilkan nama file, ukuran, dan tombol Upload
        - Tombol disabled saat sedang upload (anti double submit)

[ ] 2.1.7 <OtaDeployStatus />
        Props: deployment (OtaDeployment)
        Render: progress bar + status text + persentase
        - Listen WebSocket event OtaProgressUpdated
        - States: pending, downloading, flashing, success, failed, rollback
        - Warna sesuai status (info, warning, success, danger)

[ ] 2.1.8 <ScadaCanvas />
        Props: deviceId, sensorData (SensorData), mappings (ScadaMapping[])
        Render: container SVG utama — menggambarkan skema retort:
        tangki, pipa input/output, katup, sensor, ruang pemanas
        - Setiap elemen SVG memiliki ID unik yang di-mapping via scada_mappings
        - Skeleton loader saat WebSocket belum connected

[ ] 2.1.9 <ScadaElement />
        Props: elementId, dataSource, value, normalColor, warningColor, criticalColor,
        warningThreshold, criticalThreshold
        Render: komponen generik per elemen visual (pipa/valve/tangki/sensor)
        - Warna berubah berdasarkan value vs threshold
        - Animasi transisi warna smooth
        - Indikator stale (abu-abu + warning icon) jika data > 10 detik
```

### 2.2 — Tulis Unit Test untuk Komponen (PRD Section 12)

```
[ ] 2.2.1 Test StatusBadge: render setiap status, warna benar
[ ] 2.2.2 Test DeviceCard: render device info, klik callback
[ ] 2.2.3 Test PinConfigForm: render form, validasi duplikat pin,
         disabled saat RUN, submit callback
[ ] 2.2.4 Test FeatureToggleGroup: render toggles, toggle callback, disabled state
[ ] 2.2.5 Test OtaUploadForm: validasi file type/size, upload callback,
         disabled saat uploading
[ ] 2.2.6 Test OtaDeployStatus: render setiap status, progress bar value
[ ] 2.2.7 Test ScadaElement: warna berubah sesuai threshold, stale indicator
```

**Stop condition:** Tunjukkan setiap komponen dalam isolasi (props & states-nya) sebelum
diintegrasikan ke halaman penuh di Fase 3. Laporkan daftar komponen dan hasil test.

---

## Fase 3: Halaman & Integrasi State

**Tujuan:** Membangun semua halaman Inertia (PRD Section 8), menghubungkan ke
backend controller, dan mengimplementasikan semua UI state.

### 3.1 — Halaman: Device Registry (PRD Section 4 & 7)

```
[ ] 3.1.1 Halaman /devices (DeviceController@index)
        → Inertia page: Pages/Devices/Index.tsx
        - Daftar semua device: DeviceCard per device
        - Empty state: "Belum ada device terdaftar"
        - Tombol "Tambah Device"
        - Pagination jika banyak device
        - Status online/offline real-time via WebSocket (DeviceStatusChanged)

[ ] 3.1.2 Halaman /devices/create (DeviceController@create)
        → Inertia page: Pages/Devices/Create.tsx
        - Form: machine_code, name, mqtt_broker, mqtt_port
        - Validasi client-side + server-side error display (HTTP 422)
        - Success: redirect ke /devices + toast notification

[ ] 3.1.3 Halaman /devices/{device} (DeviceController@show)
        → Inertia page: Pages/Devices/Show.tsx
        - Detail device: semua info + StatusBadge
        - Quick links: Config, SCADA, OTA
        - Tombol Delete (konfirmasi modal)

[ ] 3.1.4 Implementasi DeviceController (store, destroy)
        - store: validasi via StoreDeviceRequest, simpan ke DB, redirect
        - destroy: hapus device + cascade (pin_configs, feature_configs, dll)
```

### 3.2 — Halaman: Pin & Feature Config (PRD Section 4 & 7)

```
[ ] 3.2.1 Halaman /devices/{device}/config (ConfigController@edit)
        → Inertia page: Pages/Devices/Config.tsx
        - DeviceSelector di header/sidebar
        - Tab atau section: Pin Configuration + Feature Toggles
        - PinConfigForm + FeatureToggleGroup components
        - Loading state: skeleton loader
        - Error state: toast notification
        - Success state: toast + "Konfigurasi berhasil dikirim ke device"

[ ] 3.2.2 Implementasi ConfigController (updatePins, updateFeatures)
        - updatePins: validasi konflik pin (UpdatePinConfigRequest), simpan ke DB,
          publish MQTT retort/{machine_code}/config/push dengan payload JSON
          seluruh konfigurasi pin + feature terbaru
        - updateFeatures: simpan ke DB, publish MQTT
        - Response 422 jika konflik pin atau proses sedang RUN
```

### 3.3 — Halaman: OTA Firmware Management (PRD Section 4 & 7)

```
[ ] 3.3.1 Halaman /ota (OtaController@index)
        → Inertia page: Pages/Ota/Index.tsx
        - Daftar firmware tersedia (FirmwareFile) + upload baru (OtaUploadForm)
        - Empty state: "Belum ada firmware"
        - Per firmware: filename, version, ukuran, tanggal upload
        - Deploy section: pilih device target (DeviceSelector) + pilih firmware + "Push Update"
        - Daftar deployment aktif/selesai per device (OtaDeployStatus)
        - Progress real-time via WebSocket (OtaProgressUpdated)

[ ] 3.3.2 Implementasi OtaController (uploadFirmware, deploy, download)
        - uploadFirmware: validasi via UploadFirmwareRequest (.bin, max 1.5MB),
          simpan ke Laravel Storage (private disk), hitung MD5 checksum
        - deploy: buat OtaDeployment record (status: pending),
          publish MQTT retort/{machine_code}/ota/notify dengan download URL
        - download: endpoint publik (signed URL/token) untuk ESP32 mengunduh .bin
```

### 3.4 — Halaman: SCADA Visual Dashboard (PRD Section 4 & 7)

```
[ ] 3.4.1 Halaman /scada/{device} (ScadaController@show)
        → Inertia page: Pages/Scada/Show.tsx
        - DeviceSelector di header
        - ScadaCanvas sebagai komponen utama
        - Data real-time via WebSocket (SensorDataReceived, channel: retort.{machineCode})
        - Skeleton loader saat WebSocket belum connected
        - Stale indicator jika data > 10 detik (abu-abu + warning icon)
        - Modul yang dinonaktifkan: elemen SCADA terkait disembunyikan (Rule 5)

[ ] 3.4.2 Halaman /devices/{device}/scada/config (ScadaController@editMapping)
        → Inertia page: Pages/Scada/Config.tsx
        - Form mapping: element_id ↔ data_source, threshold, warna
        - Preview inline

[ ] 3.4.3 Implementasi ScadaController (show, editMapping, updateMapping)
        - show: load device + scada_mappings + feature_configs, pass ke Inertia
        - updateMapping: validasi, simpan ke DB
```

### 3.5 — Halaman: Dashboard Overview

```
[ ] 3.5.1 Halaman /dashboard
        → Inertia page: Pages/Dashboard.tsx
        - Overview semua device: DeviceCard grid
        - Status ringkas: jumlah online/offline
        - Quick navigation ke Config, SCADA, OTA per device
        - Real-time update status device via WebSocket
```

### 3.6 — Layout & Navigation

```
[ ] 3.6.1 Layout utama (Layouts/AuthenticatedLayout.tsx)
        - Sidebar/navbar: Dashboard, Devices, OTA, links per device (SCADA/Config)
        - Responsive: mobile hamburger menu
        - Dark mode toggle
        - User info + logout

[ ] 3.6.2 Toast notification system (success, error, warning, info)
```

**Stop condition:** Setelah 3.1-3.2 selesai, boleh lapor dulu sebelum lanjut ke 3.3-3.6
jika halaman cukup kompleks. Pastikan semua 4 state wajib (loading, empty, error, success)
diimplementasikan di setiap halaman.

---

## Fase 4: Aturan Bisnis & Edge Cases

**Tujuan:** Mengimplementasikan semua business rules (PRD Section 9) dan
menangani semua edge cases (PRD Section 10) satu per satu.

### 4.1 — Implementasi Business Rules (PRD Section 9)

```
[ ] 4.1.1 Rule 1: Konflik pin
        IF pin yang dipilih sudah aktif dipakai fungsi lain pada device yang sama
        THEN tolak penyimpanan → HTTP 422 + pesan error "Pin sudah digunakan fungsi lain"
        Implementasi: validasi di UpdatePinConfigRequest + DB UNIQUE constraint

[ ] 4.1.2 Rule 2: Blokir config saat RUN
        IF proses retort sedang RUN pada device
        THEN konfigurasi pin/modul DIBLOKIR total
        → Cek status RUN via data terakhir dari device (field: run/status_run)
        → UI: form disabled + pesan "Tidak bisa ubah konfigurasi saat proses berjalan"
        → Backend: tolak request dengan HTTP 422

[ ] 4.1.3 Rule 3: OTA rollback
        IF proses OTA flashing gagal
        THEN ESP32 rollback otomatis (dual-partition) — ini di sisi ESP32
        → Web: update status OtaDeployment ke "failed" atau "rollback"
        → Trigger via MQTT topic retort/{machine_code}/ota/status

[ ] 4.1.4 Rule 4: Stale/offline detection
        IF device tidak mengirim data > 10 detik
        THEN status berubah ke offline/stale
        → Implementasi: scheduled check atau timestamp comparison di frontend
        → Elemen SCADA: warna abu-abu + warning icon
        → StatusBadge: "stale"

[ ] 4.1.5 Rule 5: Modul dinonaktifkan → sembunyikan elemen SCADA
        IF modul disabled pada device
        THEN elemen SCADA yang bergantung pada modul tersebut disembunyikan
        → Cek feature_configs per device, filter ScadaMapping/ScadaElement

[ ] 4.1.6 Rule 6: Device offline saat config push
        IF device offline saat config di-push
        THEN konfigurasi tetap tersimpan di DB (status: pending)
        → Publish MQTT dengan retained flag = true
        → Saat device kembali online, MQTT retained message akan diterima otomatis
        → Alternatif: sync saat boot (ESP32 request config via MQTT)

[ ] 4.1.7 Rule 7: Satu OTA per device
        Hanya satu proses OTA deployment aktif per device dalam satu waktu
        → Validasi di DeployOtaRequest: cek tidak ada OtaDeployment dengan
          status IN (pending, downloading, flashing) untuk device yang sama
```

### 4.2 — Tangani Edge Cases (PRD Section 10)

```
[ ] 4.2.1 Double submit config / double upload OTA
        → Tombol disabled + debounce setelah klik
        → Backend: idempotency check (opsional)
        → Satu proses OTA per device (Rule 7)

[ ] 4.2.2 MQTT broker down
        → Try/catch pada MQTT publish
        → Laravel menampilkan warning "Broker tidak tersedia"
        → Config tetap tersimpan di DB tapi status "pending" (belum ter-push)
        → UI feedback: toast warning

[ ] 4.2.3 ESP32 tidak merespons config push
        → Timeout 30 detik (timer setelah publish MQTT)
        → Jika tidak ada config/ack dalam 30 detik: status tetap "pending"
        → UI: tampilkan "Menunggu konfirmasi device..." + tombol "Retry"

[ ] 4.2.4 Token/session expired
        → Redirect ke login (Laravel Breeze default behavior)
        → Inertia.js akan handle 419 (CSRF) dan 401 redirect

[ ] 4.2.5 Pin reserved (SD: 10-13, RTC: 8-9)
        → Pin ini ada di dropdown tapi ditandai "reserved"
        → Tidak bisa di-reassign ke fungsi lain
        → Validasi di backend: reject assignment ke fungsi bukan default-nya

[ ] 4.2.6 Banyak device kirim data bersamaan
        → MQTT worker memproses per message (antrian)
        → Reverb broadcast per channel terpisah (retort.{machineCode})
        → Tidak campur antar device

[ ] 4.2.7 File .bin corrupt
        → Laravel: validasi MD5 checksum saat upload
        → ESP32: validasi MD5 + magic bytes saat flash (Update.h otomatis)
        → Jika gagal flash → boot dari partisi lama, status "failed/rollback"
```

**Stop condition:** Untuk setiap edge case yang perilakunya TIDAK disebutkan jelas di PRD,
berhenti dan tanya — jangan asumsikan "generic error handling" untuk semuanya.

---

## Fase 5: Testing & Finalisasi

**Tujuan:** Memastikan semua fitur berjalan sesuai PRD, semua test passing,
dan semua item Definition of Done terpenuhi.

### 5.1 — Backend Tests — PHPUnit (PRD Section 12)

```
[ ] 5.1.1 Unit test: validasi konflik pin
        → Test UpdatePinConfigRequest dengan pin duplikat → expect validation error
[ ] 5.1.2 Unit test: validasi file .bin
        → Test UploadFirmwareRequest: file bukan .bin, file > 1.5 MB → expect error
[ ] 5.1.3 Feature test: CRUD device
        → Test store, index, show, destroy — termasuk validasi unique machine_code
[ ] 5.1.4 Feature test: push config via MQTT (mock)
        → Mock MqttService, test ConfigController@updatePins → expect publish called
[ ] 5.1.5 Feature test: OTA upload + deploy flow
        → Test upload .bin (valid/invalid), deploy ke device, mock MQTT
[ ] 5.1.6 Test MQTT publish payload format (mock mqtt client)
        → Verifikasi format JSON payload yang dikirim ke ESP32
[ ] 5.1.7 Test blokir config saat RUN
        → Mock device status RUN, attempt update → expect 422
```

### 5.2 — Frontend Tests — Vitest + React Testing Library (PRD Section 12)

```
[ ] 5.2.1 Component test: PinConfigForm (render, validasi duplikat, disabled saat RUN)
[ ] 5.2.2 Component test: FeatureToggleGroup (render, toggle, disabled state)
[ ] 5.2.3 Component test: OtaUploadForm (validasi file, upload callback)
[ ] 5.2.4 SCADA rendering: ScadaElement berubah warna sesuai props threshold
[ ] 5.2.5 Test StatusBadge: setiap status render warna yang benar
```

### 5.3 — Self-Review: Definition of Done (PRD Section 13)

```
[ ] 5.3.1  Project Laravel baru berhasil dibuat dan berjalan di Laragon
[ ] 5.3.2  Device CRUD (register, list, detail, delete) berfungsi
[ ] 5.3.3  Konfigurasi pin & modul tersimpan di DB dan ter-push ke ESP32 via MQTT
[ ] 5.3.4  Validasi konflik pin dan blokir saat RUN berfungsi
[ ] 5.3.5  Upload firmware .bin, deploy ke device, ESP32 berhasil flash + reboot
[ ] 5.3.6  SCADA Dashboard menampilkan visual real-time via WebSocket (Reverb)
[ ] 5.3.7  Indikator stale/offline muncul saat device tidak kirim data > 10 detik
[ ] 5.3.8  Semua route dilindungi auth, CSRF aktif, input tervalidasi server-side
[ ] 5.3.9  Responsive di mobile/tablet/desktop, dark mode
[ ] 5.3.10 Test backend (PHPUnit) dan frontend (Vitest) passing
```

### 5.4 — Resolusi Assumptions Log

```
[ ] 5.4.1 Review semua // TODO komentar di codebase — laporkan satu per satu ke user
[ ] 5.4.2 Pastikan semua item di PRD Section 14 sudah diimplementasikan sesuai jawaban
[ ] 5.4.3 Jangan tutup TODO sendiri tanpa konfirmasi user
```

**Stop condition:** Laporkan hasil self-review DoD secara eksplisit item per item
(centang/tidak centang), jangan hanya bilang "sudah selesai".

---

## Format Laporan Akhir Setiap Fase (template siap pakai)

```
✅ Fase [n] selesai.

File dibuat/diubah:
- path/to/file1.tsx
- path/to/file2.ts

Checklist selesai: [n.1, n.2, ...]
Checklist belum/butuh review: [n.x — alasan]

Pertanyaan terbuka: [ada/tidak ada, sebutkan jika ada]

Lanjut ke Fase [n+1]? (tunggu konfirmasi)
```