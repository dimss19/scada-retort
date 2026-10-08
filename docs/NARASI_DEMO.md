# Narasi Demo Frontend — SCADA Retort (±5 menit)

Live demo script. Kolom kanan = kalimat yang diucapkan; kolom kiri = aksi di layar.

## Persiapan (lakukan sebelum mulai)
- Login lebih dulu, buka semua tab: Dashboard, Monitor TNH, Resep, Historian, ESP Logger, SCADA Editor.
- Gunakan Chrome/Edge desktop (wajib untuk fitur Web Serial).
- Jika alat fisik menyala: pastikan terhubung. Jika tidak: halaman tetap aman didemokan dengan data historis.

---

## Segmen 1 — Dashboard (±30 detik)

| Di layar | Yang diucapkan |
|---|---|
| Buka `/dashboard`. Sorot kartu kiri. | "Selamat siang, terima kasih sudah meluangkan waktu. Hari ini saya akan mendemonstrasikan halaman web SCADA Retort — sistem pemantauan proses sterilisasi retort." |
| Sorot pilihan model TNH / TNS / TNL, lalu badge status. | "Kita mulai dari Dashboard. Ada dua mode operasi. Yang kiri: USB RS-485 — komunikasi serial langsung ke temperature controller Autonics. Model bisa diganti sesuai unit, dan badge ini menunjukkan status koneksi secara real-time." |
| Sorot kartu kanan, IP ESP, badge online. | "Yang kanan: ESP Logger — gateway IoT berbasis ESP32-S3 yang mengirim data nirkabel lewat MQTT, lengkap dengan IP perangkatnya. Dashboard mengecek status ini setiap tiga detik, jadi begitu alat menyala, badge langsung berubah hijau." |
| Klik **Buka Monitoring TNH**. | "Sekarang saya masuk ke layar monitoring." |

## Segmen 2 — Monitor TN / USB RS-485 (±100 detik)

| Di layar | Yang diucapkan |
|---|---|
| Sorot header dan badge LIVE MONITOR. | "Ini layar utama operator. Di atas terlihat identitas controller dan status koneksi." |
| Sorot gauge PV, SV, dan Heating MV, lalu trend chart. | "Tiga panel utama menampilkan PV atau suhu aktual, SV atau suhu target, dan Heating MV atau beban pemanas dalam persen. Grafik di bawahnya menggambar riwayat suhu secara langsung." |
| Sorot tombol RUN, STOP, Reset Alarm. | "Dari sini operator mengontrol proses: tombol RUN dan STOP, serta Reset Alarm. Semua perintah dikirim langsung ke alat." |
| Klik **Scan Port USB** → tunjukkan dialog pilih port browser. | "Fitur unggulan halaman ini adalah Web Serial. Operator tidak perlu instal software apa pun — cukup browser Chrome atau Edge di laptop. Klik Scan Port, browser menampilkan dialog untuk memilih port USB, dan website langsung membaca register Modbus controller di baudrate 9600. Perintah RUN/STOP pun bisa dikirim dari sini." |
| Sorot tabel Process Logs dan tab **SCADA View**. | "Data yang terbaca otomatis disinkronkan ke server setiap tiga detik, sehingga riwayat tetap tercatat. Di bawah ada tabel Process Logs saat pemanas aktif, dan tab SCADA View untuk tampilan POV mesin." |

## Segmen 3 — Resep & Profil Temperatur (±40 detik)

| Di layar | Yang diucapkan |
|---|---|
| Buka menu **Resep**. Sorot tabel: Nama Resep, Target F₀, Jumlah Steps. | "Berikutnya, halaman Resep & Profil Temperatur — tempat kita mengelola template kurva sterilisasi. Perhatikan kolom Target F₀, nilai sterilitas yang jadi acuan proses." |
| Buka satu resep. Sorot Target F₀, Z-Value, T-Ref, lalu panel Pattern Steps dan grafik preview. | "Saat membuat resep, kita menentukan nilai F₀, Z-Value, dan T-Ref. Lalu menyusun langkah operasi per baris: target suhu, durasi menit dan detik. Grafik preview di samping otomatis menggambar kurva temperaturnya — jadi kita bisa pastikan profil naik-tahan-turun sudah benar sebelum diterapkan ke alat." |

## Segmen 4 — Historian & Verifikasi Batch (±70 detik)

| Di layar | Yang diucapkan |
|---|---|
| Buka **Historian**. Sorot filter periode, tanggal kustom, dan kolom pencarian. | "Ini bagian Historian — rekam jejak seluruh batch. Bisa difilter per hari, minggu, bulan, atau tanggal kustom, dan dicari berdasarkan nama produk atau kode batch." |
| Sorot filter Verified/Unverified, lalu kartu batch: durasi, suhu puncak, F₀. | "Setiap kartu batch merangkum: mesin, waktu mulai dan selesai, durasi, suhu puncak, jumlah data point, serta F₀ sistem beserta hasilnya." |
| Klik **Verifikasi** pada batch, tunjukkan form dan status berubah jadi VERIFIED. | "Yang penting untuk audit: batch yang selesai wajib diverifikasi tertulis. Kita isi data produk dan batch, statusnya berubah menjadi Verified, lengkap dengan nama dan tanggal verifikator." |
| Sorot tombol export. | "Semua bukti ini bisa diekspor menjadi laporan untuk dokumentasi dan audit." |

## Segmen 5 — ESP Logger / Mode Nirkabel (±40 detik)

| Di layar | Yang diucapkan |
|---|---|
| Buka **ESP Logger**. Sorot panel: Status Mesin, Katup, SV, Akumulasi F₀. | "Mode kedua: ESP Logger — untuk instalasi nirkabel tanpa kabel ke laptop. Datanya masuk lewat MQTT dan tampil di panel ini: status mesin, posisi katup, set value, dan akumulasi F₀ dalam menit ekuivalen." |
| Sorot TOT, STP, Pattern & Step, lalu grafik **Live Thermal Wave** dan tabel Telemetry Records. | "Ada juga waktu total proses, sisa langkah, dan pattern yang sedang berjalan. Grafik Live Thermal Wave menampilkan suhu aktual secara langsung, sementara tabel Telemetry Records menyimpan seluruh riwayat pembacaan sensor." |

## Penutup (±15 detik)

| Di layar | Yang diucapkan |
|---|---|
| Buka **SCADA Editor**. Tunjukkan drag elemen, panel Properties, dan background. | "Sebagai bonus untuk tim engineering, ada SCADA Editor: kita bisa merancang tampilan HMI sendiri dengan drag and drop, memetakan elemen ke data source, mengatur threshold peringatan, dan mengunggah background. Terima kasih — saya siap menjawab pertanyaan." |

---

## Jika Ada Kendala

| Situasi | Yang dilakukan |
|---|---|
| Alat fisik offline | Lanjutkan demo — badge menunjukkan Offline, data historis tetap tampil. Jadikan poin: "sistem mendeteksi alat mati secara real-time". |
| Dialog pilih port Web Serial tidak muncul | Pastikan Chrome/Edge desktop dan akses via localhost/HTTPS. Jika tetap gagal, lewati ke segmen Resep/Historian. |
| Historian kosong | Buka batch yang sudah ada; jika tidak ada, jelaskan alur verifikasi secara lisan. |

Tips: kalimat boleh diperpendek; yang penting urutannya tetap Dashboard → Monitor → Resep → Historian → ESP → penutup.
