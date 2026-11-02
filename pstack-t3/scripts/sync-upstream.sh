#!/bin/sh
set -eu
dir="$(cd "$(dirname "$0")/.." && pwd)/.upstream"
if [ -d "$dir/.git" ]; then
  git -C "$dir" pull --ff-only --quiet
else
  git clone --quiet --depth 1 --filter=blob:none --sparse https://github.com/cursor/plugins.git "$dir"
  git -C "$dir" sparse-checkout set pstack scripts
fi
git -C "$dir" log -1 --format='upstream %H %cd'
