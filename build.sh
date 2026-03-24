#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/site"

echo "Installing dependencies..."
npm ci

echo "Building site..."
npm run build

echo "Done → site/build/"
