#!/bin/sh
# Installs the OpenRouter Providers Panel into a DeepSeek Harness profile
# (Web and Desktop profiles alike).
#
#   ./install.sh [profile]        # default profile: web
#
# Reads $DSH_HOME (default ~/.dsh). Two install shapes are handled:
#
#   * package already listed in the profile's `dsh.profile.bundles`
#     (what the DSH "Add plugin" UI does) — the package's own cordis.patch.yml
#     mounts the row, so this script only refreshes the files;
#   * otherwise — the script copies the package into the profile's node_modules
#     and inserts the row into the profile's own cordis.patch.yml (with a backup).
#
# It never does both, because two rows with the same id would collide.
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

is_bundle_member() {
  [ -f "$PROFILE_DIR/package.json" ] || return 1
  node -e '
    const fs = require("fs");
    try {
      const manifest = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      const bundles = (manifest.dsh && manifest.dsh.profile && manifest.dsh.profile.bundles) || [];
      process.exit(bundles.includes("dsh-openrouter-providers") ? 0 : 1);
    } catch (error) {
      process.exit(1);
    }
  ' "$PROFILE_DIR/package.json"
}

mkdir -p "$PROFILE_DIR/node_modules"
rm -rf "$PROFILE_DIR/node_modules/$PKG"
cp -R "$HERE" "$PROFILE_DIR/node_modules/$PKG"
rm -rf "$PROFILE_DIR/node_modules/$PKG/.git" "$PROFILE_DIR/node_modules/$PKG/.github"
echo "install: package copied to $PROFILE_DIR/node_modules/$PKG"

PATCH="$PROFILE_DIR/cordis.patch.yml"
if [ ! -f "$PATCH" ]; then
  printf '%s\n' '[]' > "$PATCH"
fi

PATCHED=0
grep -q "$PKG" "$PATCH" && PATCHED=1

if is_bundle_member; then
  echo "install: profile lists $PKG in dsh.profile.bundles — the package mounts itself, composition untouched"
  if [ "$PATCHED" = "1" ]; then
    echo "install: WARNING — $PATCH also contains a row for $PKG; remove one of the two to avoid a duplicate id" >&2
  fi
elif [ "$PATCHED" = "1" ]; then
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
