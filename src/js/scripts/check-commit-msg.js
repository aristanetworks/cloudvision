/* eslint-disable no-console */

// This tool checks that a git commit message (in a file) conforms to our guidelines. If this
// file is ever modified, make sure to run the tests (tests/check-commit-msg/run-tests.sh) and
// add or update test files as necessary.

const fs = require('fs');

if (!process.argv[2]) {
  console.log('Usage: check-commit-msg <file with a commit message>');
  process.exit(1);
}

const CHAR_LIMIT = 72;
const CLOSES_KEY_REGEX = /^closes:/i;
const CLOSES_VALUE_REGEX = /trello.com|BUG\d+$/;
const DEPRECATED_FIXES_REGEX = /^fixes=/;
const REVERT_REGEX = /^Revert ".*"$/;
const SUBJECT_REGEX = /^\w+(\(.+\))?: .+$/;
const TYPES = ['chore', 'docs', 'feat', 'fix', 'infra', 'perf', 'refactor', 'style', 'test'];
const WIP_REGEX = /^wip:/i;

const errors = [];
const lines = fs.readFileSync(process.argv[2], 'utf-8').split('\n');

// Skip all the checks if this commit is a work in progress.
if (WIP_REGEX.test(lines[0])) {
  process.exit(0);
}

// Validate the subject line.
if (REVERT_REGEX.test([lines[0]])) {
  // This is one of those commit messages auto-generated when reverting a commit. Carry on.
} else if (!SUBJECT_REGEX.test(lines[0])) {
  errors.push('the subject must use the conventional commits style');
} else {
  const matchParts = /^\w+/.exec(lines[0]);
  const type = matchParts[0];
  if (!TYPES.includes(type)) {
    errors.push(`"${type}" is not a valid type (must be one of: ${TYPES.join(', ')})`);
  }
}

// Check that the second line is blank.
if (lines[1] !== '') {
  errors.push('the line below the subject must be completely blank');
}

// Look for an invalid "closes" line.
lines.forEach((line, i) => {
  if (CLOSES_KEY_REGEX.test(line) && !CLOSES_VALUE_REGEX.test(line)) {
    errors.push(`line ${i + 1} has an invalid "closes" value (must be a Trello link or BUG ID)`);
  }
});

// Look for an old "fixes=" line.
lines.forEach((line, i) => {
  if (DEPRECATED_FIXES_REGEX.test(line)) {
    errors.push(`line ${i + 1} uses the deprecated "fixes=" syntax, use "closes:" instead`);
  }
});

// Check that all lines are within the length limit.
lines.forEach((line, i) => {
  if (line.length > CHAR_LIMIT) {
    errors.push(`line ${i + 1} is over the limit of ${CHAR_LIMIT} characters`);
  }
});

// Print the errors.
if (errors.length > 0) {
  console.log();
  console.log(`The commit message has ${errors.length > 1 ? 'errors' : 'an error'}:`);
  errors.forEach((error) => console.log(`  * ${error}`));
  console.log();
  process.exit(1);
}

process.exit(0);
