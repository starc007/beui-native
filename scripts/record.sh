#!/usr/bin/env bash
# Records showcase clips from the iOS Simulator for beui.dev.
#
#   scripts/record.sh prepare              Clean status bar (9:41, full battery)
#   scripts/record.sh theme light|dark     Switch the Simulator's appearance
#   scripts/record.sh open <slug>          Open a component's showcase page
#   scripts/record.sh start <slug> <theme> Start recording recordings/raw/<slug>-<theme>.mov
#   scripts/record.sh stop                 Stop the recording in progress
#   scripts/record.sh encode <slug> <theme> [trim-start|auto]
#                                          Write recordings/<slug>-<theme>.mp4
#                                          CUT=a-b[,c-d] drops raw seconds a
#                                          to b, such as a pause between takes.
#
# Record from a Release build (`bunx expo run:ios --configuration Release`)
# so clips show production motion and no developer overlays. Set DEVICE to a
# Simulator UDID; it defaults to the booted one.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/recordings"
RAW="$OUT/raw"
DEVICE="${DEVICE:-booted}"
SCHEME="beui-native"
PIDFILE="$RAW/.recording.pid"
# Web clips: 600 points wide keeps text crisp on retina at docs size.
WIDTH=600
# Seconds to hold the last frame before the clip loops.
HOLD="${HOLD:-1.2}"

mkdir -p "$RAW"

case "${1:-}" in
  prepare)
    xcrun simctl status_bar "$DEVICE" override \
      --time "9:41" --dataNetwork wifi --wifiMode active --wifiBars 3 \
      --cellularMode active --cellularBars 4 --batteryState charged \
      --batteryLevel 100
    ;;
  theme)
    xcrun simctl ui "$DEVICE" appearance "${2:?light or dark}"
    ;;
  open)
    # record=1 hides the back button and tab bar, which the clips don't need.
    xcrun simctl openurl "$DEVICE" "$SCHEME://${2:?slug}?record=1"
    ;;
  start)
    slug="${2:?slug}"
    theme="${3:?theme}"
    xcrun simctl io "$DEVICE" recordVideo --codec h264 --force \
      "$RAW/$slug-$theme.mov" >/dev/null 2>&1 &
    echo $! >"$PIDFILE"
    # recordVideo needs a moment before it captures frames.
    sleep 1.5
    ;;
  stop)
    if [[ -f "$PIDFILE" ]]; then
      # recordVideo can drop frames still in flight when interrupted, so let
      # the last motion flush first. A still screen adds no frames.
      sleep 1.5
      kill -INT "$(cat "$PIDFILE")" 2>/dev/null || true
      rm -f "$PIDFILE"
      sleep 1.5
    fi
    ;;
  encode)
    slug="${2:?slug}"
    theme="${3:?theme}"
    start="${4:-auto}"
    if [[ "$start" == "auto" ]]; then
      # Half a second of rest before the first change on screen.
      first=$(ffprobe -v error -select_streams v -show_entries frame=pts_time \
        -of csv=p=0 "$RAW/$slug-$theme.mov" | tr -d , | sed -n 2p)
      start=$(awk -v t="${first:-0}" 'BEGIN { s = t - 0.5; printf "%.3f", (s < 0 ? 0 : s) }')
    fi
    # The Simulator writes frames only when the screen changes, so a resting
    # screen is one frame. Convert to constant 60 fps first, so trimming the
    # start keeps that frame instead of seeking past it. Keep frames from the
    # start on, minus any CUT ranges, then renumber them.
    keep="gte(t,$start)"
    if [[ -n "${CUT:-}" ]]; then
      IFS=, read -ra cuts <<<"$CUT"
      for cut in "${cuts[@]}"; do
        keep="$keep*not(between(t,${cut%-*},${cut#*-}))"
      done
    fi
    filters="fps=60,select='$keep',setpts=N/60/TB"
    # The raw clip ends on the last change. Hold that frame for HOLD seconds
    # so the loop rests before it restarts. Then H.264 that every browser
    # plays, no audio, and the index up front for streaming.
    filters="$filters,tpad=stop_mode=clone:stop_duration=$HOLD,scale=$WIDTH:-2:flags=lanczos"
    ffmpeg -loglevel error -y -i "$RAW/$slug-$theme.mov" \
      -filter_complex "$filters" \
      -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p \
      -movflags +faststart -an \
      "$OUT/$slug-$theme.mp4"
    ls -lh "$OUT/$slug-$theme.mp4" | awk '{print $5, $9}'
    ;;
  *)
    sed -n '2,15p' "$0"
    exit 1
    ;;
esac
