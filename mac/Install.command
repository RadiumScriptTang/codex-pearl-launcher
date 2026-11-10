#!/bin/zsh
set -euo pipefail
SOURCE="$(cd "$(dirname "$0")/.." && pwd)"
ARCH="$(uname -m)"
case "$ARCH" in arm64) RUNTIME="darwin-arm64";; *) echo "This release supports Apple Silicon (M-series) Macs only."; exit 1;; esac
if [[ ! -f "$SOURCE/vendor/$RUNTIME/bin/node" ]]; then echo 'Missing bundled Node runtime; use the complete macOS release archive.'; exit 1; fi
DEST="$HOME/Applications/Codex Pearl.app"
if [[ -e "$DEST" ]]; then
  BACKUP="$HOME/Applications/Codex Pearl.backup.$(date +%Y%m%d%H%M%S).app"
  mv "$DEST" "$BACKUP"
fi
mkdir -p "$DEST/Contents/MacOS" "$DEST/Contents/Resources/app"
ditto "$SOURCE" "$DEST/Contents/Resources/app"
NODE="$DEST/Contents/Resources/app/vendor/$RUNTIME/bin/node"
if [[ ! -f "$NODE" ]]; then echo 'Missing bundled Node runtime; use the complete macOS release archive.'; exit 1; fi
chmod +x "$NODE"
cat > "$DEST/Contents/MacOS/CodexPearl" <<'APP'
#!/bin/zsh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../Resources/app" && pwd)"
case "$(uname -m)" in arm64) ARCH=darwin-arm64;; *) exit 1;; esac
exec "$ROOT/vendor/$ARCH/bin/node" "$ROOT/launcher.cjs"
APP
chmod +x "$DEST/Contents/MacOS/CodexPearl"
cp "$SOURCE/assets/icons/codex.icns" "$DEST/Contents/Resources/codex.icns"
cat > "$DEST/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict><key>CFBundleIdentifier</key><string>org.codexpearl.launcher</string><key>CFBundleName</key><string>Codex Pearl</string><key>CFBundleDisplayName</key><string>Codex Pearl</string><key>CFBundleExecutable</key><string>CodexPearl</string><key>CFBundleIconFile</key><string>codex.icns</string><key>CFBundlePackageType</key><string>APPL</string><key>CFBundleVersion</key><string>0.2.0</string><key>LSUIElement</key><true/></dict></plist>
PLIST
ln -sfn "$DEST" "$HOME/Desktop/Codex Pearl.app"
echo "Installed: $DEST"
echo 'Drag Codex Pearl.app to the Dock. It is a launcher; the original Codex app is preserved.'
echo 'Installation is complete. Launch the new app when you are ready.'
