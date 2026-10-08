#!/usr/bin/env bash

# ==============================================================================
# Ringkas Deployment Script untuk sretort.indahmesin.com
# ==============================================================================
set -e

DOMAIN="sretort.indahmesin.com"
APP_DIR="$(pwd)"

echo "🚀 Memulai deploy: https://$DOMAIN"

# 1. Hak Akses Folder
mkdir -p "$APP_DIR/database"
touch "$APP_DIR/database/database.sqlite" 2>/dev/null || true
chown -R www-data:www-data "$APP_DIR/storage" "$APP_DIR/bootstrap/cache" "$APP_DIR/database" 2>/dev/null || true
chmod -R 775 "$APP_DIR/storage" "$APP_DIR/bootstrap/cache" "$APP_DIR/database" 2>/dev/null || true

# 2. Update File .env
if [ ! -f "$APP_DIR/.env" ] && [ -f "$APP_DIR/.env.example" ]; then
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
fi
sed -i "s|^APP_URL=.*|APP_URL=https://$DOMAIN|g" "$APP_DIR/.env" 2>/dev/null || true

# 3. Install Dependensi & Build Assets
echo "📦 Menginstall Composer & NPM Build..."
COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader --no-interaction
if [ -f "$APP_DIR/package.json" ]; then
    (npm ci || npm install) && npm run build
fi

# 4. Database Migration & Cache
echo "🗄️ Menjalankan Migration & Cache Laravel..."
if ! grep -q "^APP_KEY=base64:" "$APP_DIR/.env"; then
    php8.4 artisan key:generate --force
fi
php8.4 artisan storage:link --force 2>/dev/null || true
php8.4 artisan migrate --force
php8.4 artisan config:cache
php8.4 artisan route:cache
php8.4 artisan view:cache

# 5. Konfigurasi Nginx
echo "🌐 Konfigurasi Nginx Web Server..."
cat <<EOF > /etc/nginx/sites-available/scadaretort
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    root $APP_DIR/public;
    index index.php index.html;
    charset utf-8;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
EOF

ln -sf /etc/nginx/sites-available/scadaretort /etc/nginx/sites-enabled/scadaretort
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 6. Certbot SSL (Let's Encrypt)
if command -v certbot &> /dev/null; then
    echo "🔒 Mengaktifkan SSL Certbot Let's Encrypt..."
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@indahmesin.com --redirect || true
fi

# 7. Restart Supervisor & Fix Hak Akses
supervisorctl reread 2>/dev/null || true
supervisorctl update 2>/dev/null || true
supervisorctl restart all 2>/dev/null || true
chown -R www-data:www-data "$APP_DIR/storage" "$APP_DIR/bootstrap/cache" "$APP_DIR/database" 2>/dev/null || true

echo "✅ DEPLOY SELESAI! Akses: https://$DOMAIN"
