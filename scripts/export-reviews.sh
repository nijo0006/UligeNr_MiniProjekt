#!/bin/sh
# Saves the questionnaire answers on historical bookings in your local database to
# backend/src/startup/demo-reviews.json. Commit that file to share the reviews:
# everyone gets them on their next `docker compose up --build`.
set -eu
cd "$(dirname "$0")/.."
target=backend/src/startup/demo-reviews.json
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
docker compose exec -T app node src/startup/exportReviews.js > "$tmp"
cat "$tmp" > "$target"
echo "Saved $(grep -c '"sourceBookingId"' "$target") reviews to $target"
