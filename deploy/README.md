# 🚀 Panduan Deployment Server / VPS - SCADA Retort

Folder ini berisi skrip otomatisasi untuk deployment server Linux / VPS Ubuntu:

| File | Fungsi |
| :--- | :--- |
| `setup_vps.sh` | Skrip instalasi awal environment server (PHP 8.4, PostgreSQL, Nginx, Redis, Supervisor, Node.js). |
| `deploy.sh` | Skrip deploy aplikasi SCADA Retort ke domain produksi. |
| `deploy_dns.sh` | Skrip konfigurasi DNS dan SSL Let's Encrypt otomatis. |
| `deploy_sretort.sh` | Skrip rilis pembaruan cepat (Quick deploy git pull & cache refresh). |
| `update_vps.sh` | Skrip pembaruan rutin (Composer update, migrate, optimize:clear, restart service). |

### Cara Penggunaan:
Jalankan di server VPS dengan izin root / sudo:
```bash
sudo bash deploy/setup_vps.sh
```
