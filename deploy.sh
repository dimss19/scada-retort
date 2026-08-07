#!/usr/bin/env bash

# ==============================================================================
# Automated Non-Blocking Deployment Script with Error Reporting
# Target OS: Ubuntu 22.04 LTS
# PHP Version: PHP 8.4
# ==============================================================================

# Note: We do NOT use 'set -e' here so script continues even if a step fails.

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Track Passed and Failed Steps
PASSED_STEPS=()
FAILED_STEPS=()

execute_step() {
    local step_id="$1"
    local step_title="$2"
    local step_cmd="$3"

    echo -e "\n================================================================="
    log_info "[$step_id] Memproses: $step_title"
    echo -e "================================================================="

    if eval "$step_cmd"; then
        log_success "[$step_id] $step_title -> BERHASIL"
        PASSED_STEPS+=("[$step_id] $step_title")
        return 0
    else
        log_error "[$step_id] $step_title -> GAGAL"
        FAILED_STEPS+=("[$step_id] $step_title")
        return 1
    fi
}

# 1. Check Root Privileges
if [ "$EUID" -ne 0 ]; then
    log_error "Silakan jalankan script ini sebagai root atau gunakan sudo: sudo bash deploy.sh"
    exit 1
fi

APP_DIR="$(pwd)"
HTTP_PORT="${HTTP_PORT:-80}"
HTTPS_PORT="${HTTPS_PORT:-8443}"
PUBLIC_IP=$(hostname -I | awk '{print $1}')
[ -z "$PUBLIC_IP" ] && PUBLIC_IP="49.13.233.119"

log_info "Memulai proses deploy di: $APP_DIR"
log_info "IP Server Terdeteksi: $PUBLIC_IP"
log_info "Target HTTPS Port: $HTTPS_PORT | Target HTTP Port: $HTTP_PORT"

# ------------------------------------------------------------------------------
# STEP 1: Base System Tools Installation & Firewall Configuration
# ------------------------------------------------------------------------------
step1_cmd="
apt-get update -y && apt-get install -y software-properties-common curl git unzip zip supervisor nginx python3 python3-pip python3-venv ufw && \
ufw allow $HTTP_PORT/tcp 2>/dev/null || true && \
ufw allow $HTTPS_PORT/tcp 2>/dev/null || true && \
ufw allow 80/tcp 2>/dev/null || true && \
ufw allow 443/tcp 2>/dev/null || true
"
execute_step "1/8" "Install Perkakas Utama Sistem & Buka Firewall (Port $HTTP_PORT, $HTTPS_PORT)" "$step1_cmd"

# ------------------------------------------------------------------------------
# STEP 2: PHP 8.4 Setup via Ondrej PPA
# ------------------------------------------------------------------------------
step2_cmd="
if ! grep -q '^deb .*ondrej/php' /etc/apt/sources.list /etc/apt/sources.list.d/* 2>/dev/null; then
    add-apt-repository -y ppa:ondrej/php && apt-get update -y
fi && \
apt-get install -y php8.4-fpm php8.4-cli php8.4-common php8.4-mysql php8.4-pgsql \
    php8.4-sqlite3 php8.4-mbstring php8.4-xml php8.4-curl php8.4-zip php8.4-gd \
    php8.4-intl php8.4-bcmath php8.4-redis && \
update-alternatives --set php /usr/bin/php8.4 2>/dev/null || true
"
execute_step "2/8" "Install & Konfigurasi PHP 8.4 dan Ekstensi" "$step2_cmd"

# ------------------------------------------------------------------------------
# STEP 3: Composer & Node.js Installation
# ------------------------------------------------------------------------------
step3_cmd="
if ! command -v composer &> /dev/null; then
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
fi && \
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs
fi
"
execute_step "3/8" "Install Composer & Node.js (v20 LTS)" "$step3_cmd"

# ------------------------------------------------------------------------------
# STEP 4: Environment & Permissions Setup
# ------------------------------------------------------------------------------
step4_cmd="
if [ ! -f '$APP_DIR/.env' ] && [ -f '$APP_DIR/.env.example' ]; then
    cp '$APP_DIR/.env.example' '$APP_DIR/.env'
fi && \
chown -R www-data:www-data '$APP_DIR/storage' '$APP_DIR/bootstrap/cache' && \
chmod -R 775 '$APP_DIR/storage' '$APP_DIR/bootstrap/cache'
"
execute_step "4/8" "Setup File Environment (.env) & Hak Akses Folder" "$step4_cmd"

# ------------------------------------------------------------------------------
# STEP 5: Composer Install & NPM Build
# ------------------------------------------------------------------------------
step5_cmd="
COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader --no-interaction && \
if [ -f '$APP_DIR/package.json' ]; then
    (npm ci || npm install) && npm run build
fi
"
execute_step "5/8" "Install Paket PHP (Composer) & Build Frontend (NPM / Vite)" "$step5_cmd"

# ------------------------------------------------------------------------------
# STEP 6: Database Migration & Laravel Optimization
# ------------------------------------------------------------------------------
step6_cmd="
if ! grep -q '^APP_KEY=base64:' '$APP_DIR/.env'; then
    php8.4 artisan key:generate --force
fi && \
php8.4 artisan storage:link --force 2>/dev/null || true && \
php8.4 artisan migrate --force && \
php8.4 artisan config:cache && \
php8.4 artisan route:cache && \
php8.4 artisan view:cache && \
php8.4 artisan event:cache
"
execute_step "6/8" "Jalankan Database Migration & Build Cache Laravel" "$step6_cmd"

# ------------------------------------------------------------------------------
# STEP 7: Python Dependencies (Modbus Bridge)
# ------------------------------------------------------------------------------
step7_cmd="
if [ -f '$APP_DIR/scripts/requirements.txt' ]; then
    pip3 install -r '$APP_DIR/scripts/requirements.txt' --break-system-packages 2>/dev/null || pip3 install -r '$APP_DIR/scripts/requirements.txt'
fi
"
execute_step "7/8" "Install Dependensi Python (Modbus Bridge)" "$step7_cmd"

# ------------------------------------------------------------------------------
# STEP 8: Nginx Web Server HTTPS Setup
# ------------------------------------------------------------------------------
SSL_DIR="/etc/ssl/scadaretort"
SSL_CERT="$SSL_DIR/scadaretort.crt"
SSL_KEY="$SSL_DIR/scadaretort.key"

if [ "$HTTPS_PORT" = "443" ]; then
    REDIRECT_TARGET="https://\$host\$request_uri"
else
    REDIRECT_TARGET="https://\$host:$HTTPS_PORT\$request_uri"
fi

step8_cmd="
mkdir -p '$SSL_DIR' && \
if [ ! -f '$SSL_CERT' ] || [ ! -f '$SSL_KEY' ]; then
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout '$SSL_KEY' \
        -out '$SSL_CERT' \
        -subj '/C=ID/ST=State/L=City/O=SCADA/OU=IT/CN=$PUBLIC_IP' 2>/dev/null
    chmod 600 '$SSL_KEY'
    chmod 644 '$SSL_CERT'
fi && \
cat <<EOF > /etc/nginx/sites-available/scadaretort
server {
    listen $HTTP_PORT;
    listen [::]:$HTTP_PORT;
    server_name _ localhost $PUBLIC_IP;
    return 301 $REDIRECT_TARGET;
}

server {
    listen $HTTPS_PORT ssl http2;
    listen [::]:$HTTPS_PORT ssl http2;
    server_name _ localhost $PUBLIC_IP;
    root $APP_DIR/public;

    ssl_certificate $SSL_CERT;
    ssl_certificate_key $SSL_KEY;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    add_header X-Frame-Options 'SAMEORIGIN';
    add_header X-Content-Type-Options 'nosniff';

    index index.php index.html;
    charset utf-8;

    location / {
        try_files \\\$uri \\\$uri/ /index.php?\\\$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \\.php$ {
        fastcgi_pass unix:/run/php/php8.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \\\$realpath_root\\\$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_param HTTPS on;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\\.(?!well-known).* {
        deny all;
    }
}
EOF
ln -sf /etc/nginx/sites-available/scadaretort /etc/nginx/sites-enabled/scadaretort && \
rm -f /etc/nginx/sites-enabled/default && \
nginx -t && systemctl reload nginx
"
execute_step "8/8" "Konfigurasi Nginx Web Server (HTTPS Port $HTTPS_PORT)" "$step8_cmd"

# ------------------------------------------------------------------------------
# STEP 9: Supervisor & Crontab Setup
# ------------------------------------------------------------------------------
step9_cmd="
cat <<EOF > /etc/supervisor/conf.d/scadaretort-worker.conf
[program:scadaretort-worker]
process_name=%(program_name)s_%(process_num)02d
command=php8.4 $APP_DIR/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=$APP_DIR/storage/logs/worker.log
stopwaitsecs=3600

[program:scadaretort-mqtt]
command=php8.4 $APP_DIR/artisan mqtt:subscribe
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=$APP_DIR/storage/logs/mqtt.log
EOF
supervisorctl reread && supervisorctl update && supervisorctl restart all || true && \
CRON_JOB='* * * * * cd $APP_DIR && php8.4 artisan schedule:run >> /dev/null 2>&1' && \
((crontab -l 2>/dev/null | grep -F '$APP_DIR') || (crontab -l 2>/dev/null; echo \"\$CRON_JOB\") | crontab -)
"
execute_step "Extra" "Konfigurasi Supervisor Worker & Crontab Scheduler" "$step9_cmd"

# Final permission fix
chown -R www-data:www-data "$APP_DIR/storage" "$APP_DIR/bootstrap/cache" 2>/dev/null || true

# ------------------------------------------------------------------------------
# FINAL REPORT SUMMARY
# ------------------------------------------------------------------------------
echo -e "\n================================================================="
echo -e "                RINGKASAN STATUS DEPLOYMENT                     "
echo -e "================================================================="

echo -e "\n${GREEN}TAHAP BERHASIL (${#PASSED_STEPS[@]}):${NC}"
for step in "${PASSED_STEPS[@]}"; do
    echo -e "  ✔ $step"
done

if [ ${#FAILED_STEPS[@]} -gt 0 ]; then
    echo -e "\n${RED}TAHAP GAGAL (${#FAILED_STEPS[@]}):${NC}"
    for step in "${FAILED_STEPS[@]}"; do
        echo -e "  ✖ $step"
    done

    echo -e "\n${YELLOW}================================================================="
    echo -e "                 PETUNJUK SOLUSI & DIAGNOSIS                     "
    echo -e "=================================================================${NC}"
    
    for step in "${FAILED_STEPS[@]}"; do
        case "$step" in
            *"1/8"*)
                echo -e "  • ${RED}[System Tools]${NC}: Gagal install apt. Pastikan server memiliki akses internet dan jalankan 'apt update'."
                ;;
            *"2/8"*)
                echo -e "  • ${RED}[PHP 8.4]${NC}: Gagal install PHP 8.4. Pastikan PPA ondrej/php diizinkan atau jalankan 'apt-get update' secara manual."
                ;;
            *"3/8"*)
                echo -e "  • ${RED}[Composer/Node]${NC}: Gagal install Composer/Node.js. Coba install manual: 'apt install composer nodejs'."
                ;;
            *"5/8"*)
                echo -e "  • ${RED}[Composer/NPM]${NC}: Gagal install/build packages. Periksa RAM server (minimal 1GB/swap) atau jalankan 'composer install' / 'npm run build' manual."
                ;;
            *"6/8"*)
                echo -e "  • ${RED}[Database/Migrate]${NC}: Gagal migrasi database. Pastikan PostgreSQL aktif di port 5432 dan password/database di file .env sudah sesuai."
                ;;
            *"8/8"*)
                echo -e "  • ${RED}[Nginx]${NC}: Gagal konfigurasi Nginx. Jalankan 'nginx -t' di terminal untuk melihat lokasi syntax error."
                ;;
        esac
    done
    echo -e "\n${YELLOW}Catatan: Meskipun ada tahap gagal, proses deploy tetap dilanjutkan untuk tahap sisanya.${NC}"
else
    log_success "\nSELAMAT! SEMUA TAHAP DEPLOYMENT BERHASIL 100% TANPA ERROR."
    log_success "Aplikasi SCADA Retort siap diakses di: https://$DOMAIN_OR_IP:$HTTPS_PORT"
fi
echo -e "=================================================================\n"
