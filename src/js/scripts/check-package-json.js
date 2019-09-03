/* eslint-disable no-console */

const fs = require('fs');
const _ = require('lodash');

const DEPS = ['dependencies', 'devDependencies', 'peerDependencies', 'resolutions'];
const PATTERN = /^\d+\.\d+\.\d+(-[\w.-]+)?$/;

const foundDeps = {};
const allErrors = [];

// Check all specified package.json files for invalid or inconsistent versions.
process.argv.slice(2).forEach((packageJson) => {
  const config = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
  const errors = [];

  DEPS.forEach((key) => {
    _.keys(config[key])
      .sort()
      .forEach((packageName) => {
        if (packageName === '//') {
          return;
        }

        const version = config[key][packageName];

        if (!PATTERN.test(version)) {
          errors.push(`Invalid version found for package \`${packageName}\`: ${version}`);
        }

        if (foundDeps[packageName]) {
          const firstDep = foundDeps[packageName];
          if (firstDep.version !== version) {
            errors.push(`Inconsistent version found for package \`${packageName}\`: ${version}`);
            errors.push(`  (${firstDep.file} specified version ${firstDep.version})`);
          }
        } else {
          foundDeps[packageName] = {
            file: packageJson,
            version,
          };
        }
      });
  });

  if (errors.length > 0) {
    errors.unshift(`${packageJson}:`);
    allErrors.push(errors);
  }
});

// Print the errors.
if (allErrors.length > 0) {
  console.log();

  allErrors.forEach((errorGroup) => {
    errorGroup.forEach((error) => console.log(error));
    console.log();
  });

  process.exit(1);
}

process.exit(0);
