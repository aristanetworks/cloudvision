#!/usr/bin/env bash

filename="last-commit.msg"
git log -n 1 --format=%B > $filename
node scripts/check-commit-msg.js $filename
ret=$?
rm -f $filename
exit $ret
