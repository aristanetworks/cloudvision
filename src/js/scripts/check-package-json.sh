#!/usr/bin/env bash

packagesToCheck=`find packages/ -maxdepth 2 -name package.json`
node scripts/check-package-json.js package.json $packagesToCheck
