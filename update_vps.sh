#!/usr/bin/env bash

# ==============================================================================
#  SCADA RETORT - QUICK UPDATE SCRIPT
#  Pulls latest code, compiles assets, optimizes caches, and restarts services.
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
TARGET_BRANCH=${1:-${CURRENT_BRANCH}}
if [ "$TARGET_BRANCH" = "HEAD" ]; then TARGET_BRANCH="main"; fi

echo -e "${CYAN}${BOLD}=== Memperbarui SCADA Retort (Branch: ${TARGET_BRANCH}) ===${NC}"

# 1. Pull Git
echo -e "${YELLOW}1. Pulling latest code...${NC}"
git fetch origin
git checkout ${TARGET_BRANCH}
git pull origin ${TARGET_BRANCH}

# 2. Composer & NPM
echo -e "${YELLOW}2. Installing dependencies & building frontend...${NC}"
composer install --no-dev --optimize-autoloader --no-interaction
npm install
npm run build

# 3. Migrate & Optimize
echo -e "${YELLOW}3. Running migrations & caching routes/views...${NC}"
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 4. Restart Background Daemons
echo -e "${YELLOW}4. Restarting background daemons...${NC}"
sudo systemctl restart scada-tn-poll || true
sudo systemctl restart scada-mqtt || true
sudo systemctl restart scada-reverb || true

echo -e "${GREEN}${BOLD}✓ Update selesai & services telah direstart!${NC}"
