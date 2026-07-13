#!/bin/bash
# Watchdog that keeps the Next.js dev server alive
cd /home/z/my-project
while true; do
  # Check if server is responding
  if ! curl -s -o /dev/null -w '' http://localhost:3000/ 2>/dev/null; then
    echo "[$(date)] Server down, starting..." >> /home/z/my-project/watchdog.log
    pkill -9 -f "next dev" 2>/dev/null
    sleep 1
    nohup ./node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1 &
    disown
    sleep 8
    if curl -s -o /dev/null -w '' http://localhost:3000/ 2>/dev/null; then
      echo "[$(date)] Server started OK" >> /home/z/my-project/watchdog.log
    else
      echo "[$(date)] Server failed to start" >> /home/z/my-project/watchdog.log
    fi
  fi
  sleep 5
done
