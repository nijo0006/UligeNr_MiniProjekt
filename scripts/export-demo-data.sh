#!/bin/sh
# Saves the bookings made in the frontend and the questionnaire answers in your local
# database to backend/src/startup/demo-bookings.json and demo-reviews.json.
# Commit both files to share them: everyone gets them on `docker compose up -d --build`.
set -eu
cd "$(dirname "$0")/.."
dir=backend/src/startup
bookings=$(mktemp)
reviews=$(mktemp)
trap 'rm -f "$bookings" "$reviews"' EXIT
# Both exports must succeed before either file is replaced.
docker compose exec -T app node src/startup/exportDemoData.js bookings > "$bookings"
docker compose exec -T app node src/startup/exportDemoData.js reviews > "$reviews"
cat "$bookings" > "$dir/demo-bookings.json"
cat "$reviews" > "$dir/demo-reviews.json"
echo "Saved $(grep -c '"sharedId"' "$dir/demo-bookings.json") bookings to $dir/demo-bookings.json"
echo "Saved $(grep -c '"guest"' "$dir/demo-reviews.json") reviews to $dir/demo-reviews.json"
