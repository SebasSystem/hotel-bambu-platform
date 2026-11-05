#!/bin/sh
# Restores a custom-format dump into a database (default: PGDATABASE). Destructive for the
# target: existing objects are dropped first. Stop `api` and `web` before restoring production.
#   restore.sh /backups/db/hotel_bambu-20260101T030000Z.dump [target_db]
# A target database that does not exist is created (useful for restore drills).
set -eu

file="${1:?usage: restore.sh <dump file> [target database]}"
target="${2:-${PGDATABASE:?PGDATABASE is required}}"
: "${PGHOST:=postgres}"
export PGHOST

[ -f "$file" ] || { echo "[restore] not found: $file" >&2; exit 1; }
if [ -f "${file}.sha256" ]; then
  sha256sum -c "${file}.sha256" > /dev/null && echo "[restore] checksum ok"
fi

exists="$(psql -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$target'")"
if [ "$exists" != "1" ]; then
  echo "[restore] creating database $target"
  createdb "$target"
fi

echo "[restore] restoring $file -> $target"
pg_restore --dbname="$target" --clean --if-exists --no-owner --no-privileges --exit-on-error "$file"
echo "[restore] done"
