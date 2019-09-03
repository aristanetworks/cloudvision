#!/usr/bin/env bash

ESC="\033"
RED="${ESC}[31m"
NORMAL="${ESC}[m\017"

TEST_DIR="scripts/tests/check-commit-msg/"

failed=0

# Test all the bad commit messages.
for msg in `find $TEST_DIR -name '*bad*'`
do
  node scripts/check-commit-msg.js $msg > /dev/null

  if [ $? -ne 1 ]
  then
    echo
    echo -e "${RED}Error: invalid message but check-commit-msg passed${NORMAL}"
    echo "File: $msg"
    failed=1
  fi
done

# Test all the good commit messages.
for msg in `find $TEST_DIR -name '*good*'`
do
  node scripts/check-commit-msg.js $msg > /dev/null

  if [ $? -ne 0 ]
  then
    echo
    echo -e "${RED}Error: valid message but check-commit-msg failed${NORMAL}"
    echo "File: $msg"
    failed=1
  fi
done

if [ $failed -eq 1 ]
then
  echo
fi

exit $failed
