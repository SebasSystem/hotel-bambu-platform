#!/bin/sh
# Long-running backup service: runs backup.sh once a day at BACKUP_HOUR (local time, TZ).
# A failed run is logged and retried the next day; `docker compose logs backup` shows the history.
set -eu

HOUR="${BACKUP_HOUR:-3}"
case "$HOUR" in
  ''|*[!0-9]*) echo "[scheduler] BACKUP_HOUR must be 0-23" >&2; exit 1 ;;
esac
echo "[scheduler] daily backup at ${HOUR}:00 (${TZ:-UTC}), retention ${BACKUP_RETENTION_DAYS:-14} days"

while true; do
  now="$(date +%s)"
  next="$(date -d "$(date +%Y-%m-%d) ${HOUR}:00:00" +%s 2>/dev/null || echo 0)"
  # busybox date: fall back to arithmetic on the current time of day.
  if [ "$next" -eq 0 ]; then
    secs_today=$(( $(date +%H | sed 's/^0//;s/^$/0/') * 3600 + $(date +%M | sed 's/^0//;s/^$/0/') * 60 ))
    next=$(( now - secs_today + HOUR * 3600 ))
  fi
  [ "$next" -le "$now" ] && next=$(( next + 86400 ))
  echo "[scheduler] next run in $(( (next - now) / 60 )) min"
  sleep $(( next - now ))
  backup.sh || echo "[scheduler] backup FAILED (exit $?)" >&2
done
