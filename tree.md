# Peta Struktur Proyek SCADA Retort

Dokumen ini adalah peta orientasi untuk developer dan AI agent. Fokusnya bukan hanya lokasi file, tetapi tanggung jawab tiap bagian, aliran data, dan titik awal yang perlu dibaca sebelum mengubah kode.

## Ringkasan arsitektur

Proyek ini memakai **Laravel 13 / PHP 8.3** sebagai backend, **Inertia.js + React 18 + TypeScript** sebagai UI, **Tailwind CSS** untuk styling, **Laravel Reverb/Echo** untuk data real-time, serta bridge **Python + pymodbus** untuk komunikasi Modbus RTU dengan temperature controller seri TN.

Alur request UI umumnya:

```text
Browser (React Page)
  -> route web Laravel
  -> Controller + validasi
  -> Model/Service
  -> database atau TnModbusService
  -> scripts/modbus_bridge.py
  -> perangkat TN via serial RS-485
```

Alur polling real-time:

```text
artisan tn:poll
  -> baca register TN
  -> simpan TnReading
  -> broadcast TnDataReceived
  -> Laravel Echo
  -> halaman Monitor React diperbarui
```

API `/api/*` memakai Sanctum, controller API, Form Request, `CrudService`, repository Eloquent, lalu Resource untuk menormalkan JSON.

## Tree proyek

Folder dependency (`vendor/`, `node_modules/`) dan file runtime di `storage/` sengaja diringkas karena bukan source code yang dipelihara langsung.

```text
scadaretort/
|-- app/
|   |-- Console/Commands/
|   |   |-- PollTnControllers.php
|   |   `-- MqttSubscribeCommand.php
|   |-- Events/
|   |   |-- TnDataReceived.php
|   |   |-- SensorDataReceived.php
|   |   |-- DeviceStatusChanged.php
|   |   `-- OtaProgressUpdated.php
|   |-- Http/
|   |   |-- Controllers/
|   |   |   |-- Api/
|   |   |   |   |-- MachineController.php
|   |   |   |   |-- ControllerController.php
|   |   |   |   |-- DeviceController.php
|   |   |   |   |-- RecipeController.php
|   |   |   |   `-- BatchProductionController.php
|   |   |   |-- Auth/ (controller autentikasi Laravel Breeze)
|   |   |   |-- TnControllerController.php
|   |   |   |-- TnMonitorController.php
|   |   |   |-- TnConfigController.php
|   |   |   |-- TnRecipeController.php
|   |   |   |-- ControllerDeviceController.php
|   |   |   |-- MachineController.php
|   |   |   `-- ProfileController.php
|   |   |-- Middleware/HandleInertiaRequests.php
|   |   |-- Requests/
|   |   |   |-- Api/ (validasi payload REST)
|   |   |   |-- Auth/LoginRequest.php
|   |   |   `-- Store/Update/Deploy/Upload request lainnya
|   |   `-- Resources/ (transformer JSON API)
|   |-- Models/
|   |   |-- Machine.php
|   |   |-- TnController.php
|   |   |-- ControllerDevice.php
|   |   |-- TnReading.php
|   |   |-- TnConfig.php
|   |   |-- TnRecipeTemplate.php
|   |   |-- TnRecipeStep.php
|   |   |-- TnProcessHistory.php
|   |   |-- BatchProduction.php
|   |   |-- Device.php
|   |   |-- PinConfig.php
|   |   |-- FeatureConfig.php
|   |   |-- FirmwareFile.php
|   |   |-- OtaDeployment.php
|   |   |-- ScadaMapping.php
|   |   `-- User.php
|   |-- Providers/AppServiceProvider.php
|   |-- Repositories/
|   |   |-- Contracts/CrudRepositoryInterface.php
|   |   |-- EloquentRepository.php
|   |   `-- Machine/Controller/Device/Recipe/Batch repositories
|   `-- Services/
|       |-- TnModbusService.php
|       |-- TnRegisterMap.php
|       |-- MqttService.php
|       `-- CrudService.php
|-- bootstrap/
|   |-- app.php
|   `-- providers.php
|-- config/
|   |-- tn.php
|   |-- broadcasting.php
|   |-- reverb.php
|   |-- services.php
|   `-- konfigurasi standar Laravel lainnya
|-- database/
|   |-- factories/ (generator data test)
|   |-- migrations/ (skema dan evolusi database)
|   `-- seeders/DatabaseSeeder.php
|-- public/
|   |-- index.php
|   |-- favicon.ico
|   `-- robots.txt
|-- resources/
|   |-- css/app.css
|   |-- views/app.blade.php
|   `-- js/
|       |-- app.tsx
|       |-- bootstrap.ts
|       |-- setupTests.ts
|       |-- Layouts/
|       |   |-- AuthenticatedLayout.tsx
|       |   `-- GuestLayout.tsx
|       |-- Pages/
|       |   |-- Dashboard.tsx
|       |   |-- Operations.tsx
|       |   |-- Welcome.tsx
|       |   |-- Tn/{Index,Monitor,Config}.tsx
|       |   |-- Tn/Recipes/{Index,CreateEdit}.tsx
|       |   |-- Recipe/{Index,Form}.tsx
|       |   |-- Device/{Index,Form}.tsx
|       |   |-- Auth/ (login, register, reset, verifikasi)
|       |   `-- Profile/ (edit profil/password/akun)
|       |-- Components/
|       |   |-- Tn/ (card, gauge, status, control, chart, pattern)
|       |   |-- ScadaCanvas.tsx
|       |   |-- ScadaElement.tsx
|       |   |-- DeviceCard/DeviceSelector/StatusBadge
|       |   |-- PinConfig/FeatureToggle/Ota components
|       |   `-- komponen UI generik
|       `-- types/ (kontrak tipe domain TypeScript)
|-- routes/
|   |-- web.php
|   |-- api.php
|   |-- auth.php
|   |-- channels.php
|   `-- console.php
|-- scripts/
|   |-- modbus_bridge.py
|   |-- dev.ps1
|   `-- requirements.txt
|-- tests/
|   |-- Feature/
|   |-- Unit/
|   `-- TestCase.php
|-- TN-Modbus/ (dokumentasi register/protokol TN)
|-- storage/ (log, cache, session, file aplikasi; bukan source)
|-- vendor/ (dependency Composer; generated)
|-- node_modules/ (dependency npm; generated)
|-- artisan
|-- composer.json / composer.lock
|-- package.json / package-lock.json
|-- vite.config.js / tsconfig.json
|-- tailwind.config.js / postcss.config.js
|-- phpunit.xml
|-- .env.example
|-- README.md
|-- prd.md / workflow.md
|-- TN-Series-Step-by-Step.md / UI-Features-TN-Series.md
`-- test_*.php (skrip eksperimen/diagnostik Modbus manual)
```

## Fungsi bagian backend

### Controller web

- `TnControllerController` menampilkan daftar/detail controller TN, membuat konfigurasi cepat berdasarkan model TNH/TNL/TNS, mendeteksi port serial, menghapus controller, dan menguji koneksi.
- `TnMonitorController` menyediakan halaman monitor, data reading, penyimpanan history, serta command operasional: run/stop, set SV, auto-tune, reset alarm, dan pemilihan mode.
- `TnConfigController` membaca konfigurasi dari alat, memperbarui grup konfigurasi, memindai pattern, dan menulis pattern ke register TN.
- `TnRecipeController` menangani recipe beserta steps secara transaksional: create/update, duplicate, archive, apply ke controller, dan scan pattern dari satu atau semua perangkat.
- `ControllerDeviceController` adalah CRUD web untuk sensor/device yang berada di bawah suatu TN controller.
- `MachineController` adalah CRUD master machine. Perhatikan bahwa route web machine belum tampak didaftarkan di `routes/web.php` saat dokumen ini dibuat.
- `ProfileController` mengedit profil, password terkait, dan menghapus akun pengguna.
- `Auth/*` adalah alur Breeze: login/logout, register, reset password, konfirmasi password, dan verifikasi email.

### Service dan komunikasi perangkat

- `TnModbusService` adalah batas utama Laravel dengan Modbus. Service ini menentukan port, membangun command Python, mengunci akses port agar request/poller tidak bertabrakan, menjalankan bridge, membaca JSON hasilnya, lalu menyediakan operasi baca/tulis register dan coil.
- `TnRegisterMap` memusatkan alamat register dan metadata parameter TN. Baca file ini bersama dokumentasi `TN-Modbus/` sebelum mengubah alamat, offset, scaling, atau tipe data.
- `MqttService` memublikasikan konfigurasi device dan notifikasi OTA ke broker MQTT.
- `CrudService` membungkus operasi repository dalam transaksi database untuk API master data.

### Command dan event

- `PollTnControllers` membaca controller aktif secara berkala, menyimpan snapshot ke `tn_readings`, memperbarui status online, lalu menyiarkan `TnDataReceived`.
- `MqttSubscribeCommand` mendengarkan topik telemetry/status/OTA dari perangkat MQTT dan menerjemahkannya menjadi update database/event.
- `TnDataReceived` memasok data TN real-time ke monitor.
- `SensorDataReceived`, `DeviceStatusChanged`, dan `OtaProgressUpdated` memasok telemetry, status koneksi, serta progres OTA ke channel broadcast terkait machine.

### Repository, request, dan resource API

- `CrudRepositoryInterface` mendefinisikan operasi `all`, `find`, `create`, `update`, dan `delete`.
- `EloquentRepository` adalah implementasi generik; repository domain hanya memasok model yang benar.
- `Requests/Api/*` adalah sumber aturan validasi REST. Ubah aturan domain di sini, bukan di React saja.
- `Resources/*` menetapkan nama dan bentuk field JSON keluar. Beberapa nama sengaja dipetakan, misalnya model `name` menjadi `controller_name` atau `recipe_name`.
- Controller `Api/*` mengekspos REST resource untuk machine, controller, device, recipe, dan batch production di bawah middleware `auth:sanctum`.

## Model dan relasi domain

```text
Machine
|-- hasMany TnController
|   |-- hasMany ControllerDevice
|   |-- hasMany TnReading
|   `-- hasMany TnConfig
`-- hasMany BatchProduction
    |-- belongsTo TnRecipeTemplate
    `-- belongsTo User (operator)

TnRecipeTemplate
|-- hasMany TnRecipeStep
|-- belongsTo User (creator/approver/updater)
`-- hasMany BatchProduction

Device (domain MQTT/OTA lama atau paralel)
|-- hasMany PinConfig
|-- hasMany FeatureConfig
|-- hasMany OtaDeployment
`-- hasMany ScadaMapping

FirmwareFile
`-- hasMany OtaDeployment
```

`ControllerDevice` adalah sensor/perangkat proses yang terkait ke `TnController`. Ini berbeda dari model `Device`, yang dipakai subsistem MQTT, pin configuration, OTA, dan SCADA mapping. AI agent tidak boleh menyatukan keduanya hanya karena namanya mirip.

Model penting lainnya:

- `TnReading`: snapshot PV, SV, output, status pattern, alarm, dan data proses hasil polling.
- `TnConfig`: nilai konfigurasi per controller dan grup/register.
- `TnProcessHistory`: rekaman satu sesi/proses untuk historian.
- `ScadaMapping`: posisi dan konfigurasi visual elemen SCADA, termasuk dependency modul.
- `FirmwareFile` + `OtaDeployment`: artefak firmware dan status pengiriman OTA ke device.

## Fungsi bagian frontend

- `app.tsx` adalah entry point Inertia; memetakan nama page Laravel ke `Pages/**/*.tsx`, memasang React root, progress bar, dan membersihkan service worker usang saat development.
- `AuthenticatedLayout` menyediakan shell navigasi pengguna login; `GuestLayout` membungkus halaman autentikasi.
- `Pages/Tn/Index` menampilkan controller; `Monitor` adalah layar live; `Config` mengatur parameter/pattern.
- `Pages/Recipe/*` adalah UI recipe utama yang diroute oleh `TnRecipeController`. Folder `Pages/Tn/Recipes/*` juga ada dan perlu diperiksa sebelum refactor karena dapat merupakan implementasi lama/alternatif.
- `Pages/Operations` menampung beberapa modul operasional dalam satu file: SCADA, historian, alarm, notifications, dan database view.
- `Components/Tn/TnControlPanel` mengirim aksi operator; `TnGauge`, `TnStatusPanel`, dan `TnTrendChart` memvisualisasikan reading; `PatternConfig` membaca/menulis pattern.
- `ScadaCanvas` menyusun elemen berdasarkan mapping; `ScadaElement` merender satu indikator dengan data sensor.
- `types/*` adalah kontrak frontend. Sinkronkan perubahan payload backend dengan tipe terkait.

## Database dan urutan migrasi domain

Migrasi awal membuat user, cache, jobs, dan session. Migrasi tanggal `2026_07_14` menambahkan domain device/feature/firmware/OTA/SCADA. Migrasi `2026_07_16` menambahkan controller TN, reading, config, recipe/step, machine, relasi controller-device, process history, batch, serta peningkatan recipe/master data. Migrasi `2026_07_17` menyempurnakan pattern status dan history.

Jangan mengedit migrasi yang sudah pernah dijalankan di environment bersama. Tambahkan migrasi baru untuk perubahan skema.

## Route dan entry point

- `/` adalah landing page.
- `/dashboard` merangkum jumlah controller, controller online, dan recipe.
- `/tn/*` menangani controller, monitoring, command, reading, history, config, dan pattern.
- `/recipes/*` menangani recipe dan apply/scan perangkat.
- `/devices/*` menangani `ControllerDevice` melalui UI.
- `/scada`, `/historian`, dan `/database` merender modul di `Operations.tsx`.
- `/api/{machines|controllers|devices|recipes|batches}` adalah REST API berproteksi Sanctum.
- `/up` adalah health endpoint Laravel.
- `/test-lock` adalah endpoint diagnosis lock port Modbus; evaluasi sebelum dipertahankan di production.

## Menjalankan dan menguji

```powershell
composer run setup       # install, siapkan env/key/db, dan build frontend
composer run dev         # jalankan stack development melalui scripts/dev.ps1
composer test            # test backend Laravel/PHPUnit
npm test                 # test frontend Vitest
npm run build            # type-check TypeScript dan build Vite
```

`scripts/requirements.txt` berisi dependency bridge Python. `scripts/dev.ps1` adalah sumber kebenaran proses apa saja yang dijalankan bersama saat development.

## Panduan cepat untuk AI agent

1. Tentukan jalur perubahan: UI Inertia, REST API, polling/broadcast, atau komunikasi Modbus.
2. Untuk fitur TN, baca berurutan: route -> controller -> `TnModbusService` -> `TnRegisterMap` -> `modbus_bridge.py` -> dokumen `TN-Modbus/`.
3. Untuk perubahan data, periksa migration, model (`fillable`/`casts`/relasi), request validation, resource, dan tipe TypeScript.
4. Untuk data real-time, cocokkan nama channel/event backend dengan subscription Echo frontend.
5. Jangan mengedit `vendor/`, `node_modules/`, cache bootstrap, atau file generated build.
6. Jangan mengandalkan `.env` lokal sebagai dokumentasi; tambahkan key baru ke `.env.example` tanpa memasukkan secret.
7. Pertahankan lock serial di jalur Modbus. Akses paralel ke port RS-485 dapat menyebabkan timeout atau frame rusak.
8. Jalankan test yang relevan dan `npm run build` setelah mengubah kontrak TypeScript/React.

## Dokumen referensi

- `README.md`: petunjuk awal proyek.
- `prd.md`: kebutuhan produk dan domain industri.
- `workflow.md`: workflow sistem yang direncanakan.
- `TN-Series-Step-by-Step.md`: panduan implementasi/perangkat TN.
- `UI-Features-TN-Series.md`: rancangan fitur UI TN.
- `TN-Modbus/README.md` dan bab `01`-`17`: register map per kelompok parameter; `Appendix.md` berisi materi pelengkap.
- `test_modbus.php`, `test_offset_0.php`, `test_pattern1.php`, `test_scan_api.php`, `test_sweep.php`, `test_tight.php`: alat diagnosis manual, bukan bagian test suite PHPUnit utama.

---

Terakhir diperbarui: **19 Juli 2026**. Jika struktur atau alur utama berubah, perbarui dokumen ini dalam commit yang sama agar tetap berguna sebagai konteks bagi AI agent berikutnya.
