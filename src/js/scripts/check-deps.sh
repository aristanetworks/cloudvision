#!/usr/bin/env bash

# This command-line argument is used by `yarn run configure`.
TOOLS_ONLY=0
if [ "$1" == "--tools-only" ]
then
  TOOLS_ONLY=1
fi

NPM_VERSION_MIN="6.4.1"
REGISTRY="https://registry.npmjs.org/"
YARN_VERSION_MIN="1.13.0"
NODE_VERSION_MIN="v10.16.*"

failed=0

# Check the Node version.
nodeVer=`node --version`
if [[ "$nodeVer" != $NODE_VERSION_MIN ]]
then
  echo
  echo "Dependency check failed: wrong Node version found"
  echo "Expected: $NODE_VERSION_MIN"
  echo "Found: $nodeVer"
  failed=1
fi

# Check the yarn version.
yarnVer=`yarn --version`
node -e "process.exit(require('semver').lt('$yarnVer', '$YARN_VERSION_MIN') ? 1 : 0)"
if [ $? -eq 1 ]
then
  echo
  echo "Dependency check failed: inadequate yarn version found"
  echo "Expected: $YARN_VERSION_MIN or higher"
  echo "Found: $yarnVer"
  failed=1
fi

# Check the npm version.
npmVer=`npm --version`
node -e "process.exit(require('semver').lt('$npmVer', '$NPM_VERSION_MIN') ? 1 : 0)"
if [ $? -eq 1 ]
then
  echo
  echo "Dependency check failed: inadequate npm version found"
  echo "Expected: $NPM_VERSION_MIN or higher"
  echo "Found: $npmVer"
  failed=1
fi

if [[ $TOOLS_ONLY -eq 0 ]]
then
  # Check for remote repositories.
  output=`yarn list | grep "git://" 2>&1`
  if [ "$output" != "" ]
  then
    echo
    echo "Dependency check failed: remote repositories found"
    echo "$output"
    failed=1
  fi

  # Check the npm and yarn registry configuration.
  # Note, that npm adds a trailing slash
  yarnregistry=`yarn config get registry`
  npmregistry=`npm config get registry`
  if [[ "$yarnregistry" != "$REGISTRY" || "$npmregistry" != "$REGISTRY" ]]
  then
    echo
    echo "Dependency check failed: wrong yarn or npm registry found"
    echo "Expected: $REGISTRY"
    echo "Found yarn configured to: $yarnregistry"
    echo "Found npm configured to: $npmregistry"
    failed=1
  fi
fi

if [ $failed -eq 1 ]
then
  echo
fi

exit $failed
