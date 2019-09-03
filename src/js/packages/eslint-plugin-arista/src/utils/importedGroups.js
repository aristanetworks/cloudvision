const internal = '@arista';
const geiger = 'geiger';
const main = 'modules/main';
const moduleDirectory = 'modules/';
const stylesheet = '.less';
const parentDirectory = '..';
const currentDirectory = '.';

function findImportGroup(name) {
  if (name.startsWith(internal)) {
    return 'internal';
  }

  if (name.startsWith(geiger)) {
    return 'geiger';
  }

  if (name.startsWith(main)) {
    return 'main';
  }

  if (name.startsWith(moduleDirectory)) {
    return 'module';
  }

  if (name.endsWith(stylesheet)) {
    return 'stylesheet';
  }

  if (name.startsWith(parentDirectory)) {
    return 'parentDirectory';
  }

  if (name.startsWith(currentDirectory)) {
    return 'currentDirectory';
  }

  return 'external';
}

module.exports = findImportGroup;
