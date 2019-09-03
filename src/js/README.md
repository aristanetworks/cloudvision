# CloudVision

This repo contains open sourced reusable JavaScript components for our front-end apps created at Arista. Each directory in **packages** is a separate package with its own `package.json` and `node_modules`. The repo is a [lerna repo](https://lernajs.io/), so versioning and publishing are handled by lerna and these commands are run from the root. If you are working with just one package, then execute the commands from within a package directory, not the root directory of the repo.

## Getting Started

1. Fork the `CloudVision` repo.
2. Install all the dependencies by running `yarn run clean-install` from the JavaScript root (src/js).
3. Run `yarn run ci` to build and test all packages. This insures that your tree is in a sane, working state.

## Writing Commit Messages

We use [conventional commits](https://conventionalcommits.org/) to determine version bumps automatically, as well as autogenerating a changelog. Use **fix** for patch versions, **feat** for minor versions and **BREAKING CHANGE** for a major version. Each of these should be scoped to the package e.g. `chore(cloudvision-connector): <message>`. For maintenance that should not affect versioning use **chore** e.g. `chore(cloudvision-connector): <message>`.

## Contributing

Contributing pull requests are gladly welcomed for this repository. Please note that all contributions that modify the library behavior require corresponding test cases otherwise the pull request will be rejected.

## License

Copyright Arista (c) 2019

The MIT License (MIT)

Copyright (c) 2017-present, Arista Networks, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
