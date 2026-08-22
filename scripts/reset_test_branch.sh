#!/usr/bin/env bash
# Reset the test-auto-update branch to match master and force-push.
set -e

git fetch origin
git checkout test-auto-update
git reset --hard origin/master
git push origin test-auto-update --force
echo "Branch test-auto-update reset to master and force-pushed."
