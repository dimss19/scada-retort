#!/usr/bin/env bash

# ==============================================================================
#  SCADA RETORT - VPS SETUP & DEPLOYMENT SCRIPT (Ubuntu / Debian)
#  Branch: integrasi-esp
#  Features: Git sync, Composer, NPM Build, Migrations, Systemd (TN Poll, MQTT, Reverb)
# ==============================================================================

set -e

# Color definitions for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

TARGET_BRANCH="integrasi-esp"
APP_DIR=$(pwd)
CURRENT_USER=$(whoami)

echo -e "${CYAN}${BOLD}====================================================${NC}"
echo -e "${CYAN}${BOLD}     SCADA RETORT - VPS SETUP & CONFIGURATION       ${NC}"
echo -e "${CYAN}${BOLD}====================================================${NC}"
echo -e "${BLUE}Directory :${NC} ${APP_DIR}"
echo -e "${BLUE}User      :${NC} ${CURRENT_USER}"
echo -e "${BLUE}Branch    :${NC} ${TARGET_BRANCH}"
echo ""

# 1. Check PHP Version
echo -e "${YELLOW}[1/7] Memeriksa PHP & Ekstensi...${NC}"
if ! command -v php &> /dev/null; then
    echo -e "${RED}Error: PHP tidak ditemukan! Install PHP 8.2 atau 8.3 terlebih dahulu.${NC}"
    exit 1
fi
PHP_BIN=$(which php)
echo -e "${GREEN}✓ PHP binary: ${PHP_BIN} ($(php -r 'echo PHP_VERSION;'))${NC}"

# 2. Check Composer & Node/NPM
echo -e "${YELLOW}[2/7] Memeriksa Composer & NPM...${NC}"
if ! command -v composer &> /dev/null; then
    echo -e "${RED}Error: Composer tidak ditemukan! Silakan install composer.${NC}"
    exit 1
fi
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: NPM tidak ditemukan! Silakan install Node.js & NPM.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Composer & NPM tersedia.${NC}"

# 3. Git Branch Checkout & Pull
echo -e "${YELLOW}[3/7] Sinkronisasi Git Repository (Branch: ${TARGET_BRANCH})...${NC}"
git fetch origin
git checkout ${TARGET_BRANCH} || git checkout -b ${TARGET_BRANCH} origin/${TARGET_BRANCH}
git pull origin ${TARGET_BRANCH}
echo -e "${GREEN}✓ Kode terbaru berhasil di-pull.${NC}"

# 4. Dependency Installation & Asset Compilation
echo -e "${YELLOW}[4/7] Menginstall Dependensi PHP & Build Frontend...${NC}"
composer install --no-dev --optimize-autoloader --no-interaction
npm install
npm run build
echo -e "${GREEN}✓ Build asset frontend berhasil.${NC}"

# 5. Database Migration & Cache Optimization
echo -e "${YELLOW}[5/7] Menjalankan Database Migration & Optimasi Cache...${NC}"
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Set directory permissions
echo -e "${YELLOW}Mengatur hak akses storage & bootstrap/cache...${NC}"
chmod -R 775 storage bootstrap/cache
if [ "$EUID" -eq 0 ]; then
    chown -R www-data:www-data storage bootstrap/cache
fi
echo -e "${GREEN}✓ Permisi dan cache selesai.${NC}"

# 6. Setup Systemd Background Services (TN Poll, MQTT Subscribe, Reverb)
echo -e "${YELLOW}[6/7] Mengatur Background Services (Systemd)...${NC}"

if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}Perhatian: Script tidak dijalankan sebagai root (sudo).${NC}"
    echo -e "${YELLOW}File service akan dibuat di direktori saat ini. Jalankan dengan sudo untuk mengaktifkan.${NC}"
fi

# A. Service TN Controller Poller (Modbus)
TN_POLL_SERVICE="/etc/systemd/system/scada-tn-poll.service"
sudo tee ${TN_POLL_SERVICE} > /dev/null <<EOF
[Unit]
Description=SCADA Retort - Autonics TN Controller Poller
After=network.target

[Service]
Type=simple
User=${CURRENT_USER}
WorkingDirectory=${APP_DIR}
ExecStart=${PHP_BIN} ${APP_DIR}/artisan tn:poll --interval=1
Restart=always
RestartSec=3
StandardOutput=append:${APP_DIR}/storage/logs/tn-poll.log
StandardError=append:${APP_DIR}/storage/logs/tn-poll-error.log

[Install]
WantedBy=multi-user.target
EOF
echo -e "${GREEN}✓ Service scada-tn-poll dibuat.${NC}"

# B. Service MQTT Subscriber (ESP32 Telemetry Listener)
MQTT_SERVICE="/etc/systemd/system/scada-mqtt.service"
sudo tee ${MQTT_SERVICE} > /dev/null <<EOF
[Unit]
Description=SCADA Retort - MQTT Subscriber for ESP32 Logger
After=network.target

[Service]
Type=simple
User=${CURRENT_USER}
WorkingDirectory=${APP_DIR}
ExecStart=${PHP_BIN} ${APP_DIR}/artisan mqtt:subscribe
Restart=always
RestartSec=5
StandardOutput=append:${APP_DIR}/storage/logs/mqtt-subscribe.log
StandardError=append:${APP_DIR}/storage/logs/mqtt-subscribe-error.log

[Install]
WantedBy=multi-user.target
EOF
echo -e "${GREEN}✓ Service scada-mqtt dibuat.${NC}"

# C. Service Laravel Reverb (WebSockets)
REVERB_SERVICE="/etc/systemd/system/scada-reverb.service"
sudo tee ${REVERB_SERVICE} > /dev/null <<EOF
[Unit]
Description=SCADA Retort - Laravel Reverb WebSocket Server
After=network.target

[Service]
Type=simple
User=${CURRENT_USER}
WorkingDirectory=${APP_DIR}
ExecStart=${PHP_BIN} ${APP_DIR}/artisan reverb:start --host=0.0.0.0 --port=8080
Restart=always
RestartSec=5
StandardOutput=append:${APP_DIR}/storage/logs/reverb.log
StandardError=append:${APP_DIR}/storage/logs/reverb-error.log

[Install]
WantedBy=multi-user.target
EOF
echo -e "${GREEN}✓ Service scada-reverb dibuat.${NC}"

# 7. Reload & Start Services
echo -e "${YELLOW}[7/7] Memuat ulang daemon & mengaktifkan services...${NC}"
sudo systemctl daemon-reload

sudo systemctl enable scada-tn-poll
sudo systemctl restart scada-tn-poll

sudo systemctl enable scada-mqtt
sudo systemctl restart scada-mqtt

sudo systemctl enable scada-reverb
sudo systemctl restart scada-reverb

echo ""
echo -e "${GREEN}${BOLD}====================================================${NC}"
echo -e "${GREEN}${BOLD}  SETUP VPS SELESAI & SERVICES BERHASIL DIAKTIFKAN! ${NC}"
echo -e "${GREEN}${BOLD}====================================================${NC}"
echo ""
echo -e "${CYAN}Cek status service kapan saja dengan:${NC}"
echo -e "  sudo systemctl status scada-tn-poll"
echo -e "  sudo systemctl status scada-mqtt"
echo -e "  sudo systemctl status scada-reverb"
echo ""
echo -e "${CYAN}Cek log realtime dengan:${NC}"
echo -e "  tail -f storage/logs/tn-poll.log"
echo -e "  tail -f storage/logs/mqtt-subscribe.log"
echo -e "  tail -f storage/logs/reverb.log"
echo ""
