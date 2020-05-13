const path = require('path');
const chalk = require('chalk');
const rootPath = require('app-root-path');
const latestVersion = require('latest-version');
const pkg = require(path.join(rootPath.resolve(`/package.json`)));

/**
 * Checks to ensure that the generators/CLI in use are the latest ones
 * If they are not show prompt to tell users to upgrade
 * @param {*} pkgName
 */
async function checkGeneratorVersion(pkgName = null) {
  let generatorPkg = pkg;

  // if no pkgName then we assume this is for the CLI
  if (pkgName) {
    const packagePath = resolvePackageIfExists(pkgName);
    generatorPkg = packagePath ? require(packagePath) : pkg;
  }

  const { name, version: installedVersion } = generatorPkg;
  const latestPkgVersion = await latestVersion(name).catch((e) => {
    return installedVersion;
  });
  if (installedVersion !== latestPkgVersion) {
    console.log('');
    console.log(`Update available for ${chalk.red(`${name}`)}: 
    ${chalk.green(`Latest: ${latestPkgVersion}`)}
    ${chalk.grey(`Current: ${installedVersion}`)}`);
    console.log('');
    console.log(
      `Run ${chalk.magenta(`yarn global add @movable/cli`)} to get the latest blueprints`
    );
    console.log('');
  }
}

/**
 * Display CLI options via --help
 */
function helpText() {
  console.log(`${chalk.green('Usage:')} movable [command] [options]`);
  console.log('');
  console.log(`${chalk.green('Command options:')}`);
  console.log('  generate');
  console.log('');
  console.log(`${chalk.green('General options')}:`);
  console.log(`  --help         # Print this info and generator's options and usage`);
  console.log(`  --version      # Print version`);
  console.log('');
  console.log(`${chalk.magenta('generate')} options:`);
  console.log('');
  console.log(`  ${chalk.green('Install a template')}:`);
  console.log('');
  console.log(`    $ movable generate @movable-internal/remote-upload-blueprint`);
  console.log(``);
  console.log(`  ${chalk.green('Run local generators')}:`);
  console.log(``);
  console.log(`    Additionally, you can also run local generators without installing via npm.`);
  console.log(``);
  console.log(
    `    $ movable generate /Users/michaelnguygen/Sites/sd-packages/blueprints/remote-upload`
  );
  console.log(`  `);
  console.log(`  ${chalk.green('Optional argument')}:`);
  console.log(``);
  console.log(`    --name         # Name of app to skip name prompt`);
}

/**
 * Check to see if package exists
 *
 * @param {*} package
 */
function resolvePackageIfExists(package) {
  try {
    return require.resolve(`${package}/package.json`);
  } catch (e) {
    return null;
  }
}

module.exports = {
  helpText,
  checkGeneratorVersion,
  resolvePackageIfExists,
};
