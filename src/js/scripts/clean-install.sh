#!/usr/bin/env bash

find . -name node_modules | xargs rm -rf &&
rm -rf ~/.node-gyp &&
yarn run clean-cache &&
yarn install --frozen-lockfile
