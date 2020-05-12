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
    const packagePath = path.join(rootPath.resolve(`/node_modules/${pkgName}/package.json`));
    generatorPkg = require(packagePath);
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
  console.log(`${chalk.green('Usage:')} movable [command] [options]

${chalk.green('Command options:')}
  generate

${chalk.green('General options')}:
  --help         # Print this info and generator's options and usage
  --version      # Print version

${chalk.magenta('generate')} options:

  ${chalk.green('Install a template')}:

    $ movable generate @movable-internal/remote-upload-blueprint

  ${chalk.green('Run local generators')}:

    Additionally, you can also run local generators without installing via npm.

    $ movable generate /Users/michaelnguygen/Sites/sd-packages/blueprints/remote-upload
  
  ${chalk.green('Optional argument')}:

    --name         # Name of app to skip name prompt
`);
}

module.exports = {
  helpText,
  checkGeneratorVersion,
};
