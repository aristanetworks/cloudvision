#!/usr/bin/env bash

# This command-line argument is used during patchset builds to limit `lerna run` commands to only
# those packages that have changes.
LERNA_RUN_FLAG=""
if [ "$1" == "--patchset" ]
then
  LERNA_RUN_FLAG="--include-filtered-dependencies --since"
fi

yarn run check-commit-msg &&
yarn run clean:projects &&
yarn run bootstrap &&
yarn run check-package-json &&
yarn run check-deps &&
yarn run flow $LERNA_RUN_FLAG &&
yarn run lint $LERNA_RUN_FLAG &&
yarn run build $LERNA_RUN_FLAG &&
yarn run test:cov $LERNA_RUN_FLAG
