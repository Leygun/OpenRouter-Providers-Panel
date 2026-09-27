#!/bin/sh
# Installs the OpenRouter Providers Panel into a DeepSeek Harness profile.
#
#   ./install.sh [profile]
#
# Default profile: web. Reads $DSH_HOME (default ~/.dsh). Idempotent: re-running
# updates the installed copy and leaves an already-patched composition alone.
set -eu

PROFILE="${1:-web}"
DSH_HOME_DIR="${DSH_HOME:-$HOME/.dsh}"
PROFILE_DIR="$DSH_HOME_DIR/profiles/$PROFILE"
PKG="dsh-openrouter-providers"
ENTRY_ID="openrouter-providers"
HERE=$(cd "$(dirname "$0")" && pwd)

if [ ! -d "$PROFILE_DIR" ]; then
  echo "install: profile directory not found: $PROFILE_DIR" >&2
  echo "install: start the harness once (dsh --profile $PROFILE), then re-run" >&2
  exit 1
fi

mkdir -p "$PROFILE_DIR/node_modules"
rm -rf "$PROFILE_DIR/node_modules/$PKG"
cp -R "$HERE" "$PROFILE_DIR/node_modules/$PKG"
rm -rf "$PROFILE_DIR/node_modules/$PKG/.git" "$PROFILE_DIR/node_modules/$PKG/.github"
echo "install: package copied to $PROFILE_DIR/node_modules/$PKG"

PATCH="$PROFILE_DIR/cordis.patch.yml"
if [ ! -f "$PATCH" ]; then
  printf '%s\n' '[]' > "$PATCH"
fi

if grep -q "$PKG" "$PATCH"; then
  echo "install: composition already lists $PKG, left unchanged"
else
  cp "$PATCH" "$PATCH.orig"
  TMP="$PATCH.tmp.$$"
  if grep -qx '[[:space:]]*\[\][[:space:]]*' "$PATCH"; then
    awk -v pkg="$PKG" -v id="$ENTRY_ID" '
      /^[[:space:]]*\[\][[:space:]]*$/ {
        print "- insert:"
        print "    - id: " id
        print "      name: " pkg
        next
      }
      { print }
    ' "$PATCH" > "$TMP"
  else
    cp "$PATCH" "$TMP"
    {
      printf '\n%s\n' "- insert:"
      printf '    - id: %s\n' "$ENTRY_ID"
      printf '      name: %s\n' "$PKG"
    } >> "$TMP"
  fi
  mv "$TMP" "$PATCH"
  echo "install: composition updated ($PATCH, backup: $PATCH.orig)"
fi

echo "install: done — restart the harness:  dsh --profile $PROFILE"
