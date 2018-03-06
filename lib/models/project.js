const EmberProject = require("ember-cli/lib/models/project");
const path = require("path");
const findup = require('find-up');
const logger = require('heimdalljs-logger')('movable-cli:project');
const fs = require('fs-extra');

let processCwd = process.cwd();
// ensure NULL_PROJECT is a singleton
let NULL_PROJECT;

class Project extends EmberProject {

  blueprintLookupPaths() {
    return [path.join(__dirname, "../../blueprints")];
  }

  /**
    Returns a new project based on the first package.json that is found
    in `pathName`.

    @private
    @static
    @method closestSync
    @param  {String} pathName Path to your project
    @param  {UI} _ui The UI instance to provide to the created Project.
    @return {Project}         Project instance
   */
  static closestSync(pathName, _ui, _cli) {
    logger.info('looking for package.json starting at %s', pathName);

    let ui = ensureUI(_ui);

    let directory = findupPath(pathName);
    logger.info('found package.json at %s', directory);

    let relative = path.relative(directory, pathName);
    if (relative.indexOf('tmp') === 0) {
      logger.info('ignoring parent project since we are in the tmp folder of the project');
      return Project.nullProject(_ui, _cli);
    }

    let pkg = fs.readJsonSync(path.join(directory, 'package.json'));
    logger.info('project name: %s', pkg && pkg.name);

    if(isYarnWorkspacesProject(pkg)) {
      logger.info('ignoring parent project since we are in a monorepo');
      return Project.nullProject(_ui, _cli);
    }

    if (!isMovableCliProject(pkg)) {
      logger.info('ignoring parent project since it is not an ember-cli project');
      // Someday we will error on this, but not today.
      // return Project.nullProject(_ui, _cli);
    }

    return new Project(directory, pkg, ui, _cli);
  }

  static nullProject(ui, cli) {
    if (NULL_PROJECT) { return NULL_PROJECT; }

    NULL_PROJECT = new Project(processCwd, {}, ui, cli);

    NULL_PROJECT.isEmberCLIProject = function() {
      return false;
    };

    NULL_PROJECT.isEmberCLIAddon = function() {
      return false;
    };

    NULL_PROJECT.name = function() {
      return path.basename(process.cwd());
    };

    NULL_PROJECT.initializeAddons();

    return NULL_PROJECT;
  }

  /**
    Returns a new project based on the first package.json that is found
    in `pathName`, or the nullProject.

    The nullProject signifies no-project, but abides by the null object pattern

    @private
    @static
    @method projectOrnullProject
    @param  {UI} _ui The UI instance to provide to the created Project.
    @return {Project}         Project instance
   */
  static projectOrnullProject(_ui, _cli) {
    try {
      return Project.closestSync(process.cwd(), _ui, _cli);
    } catch (reason) {
      if (reason instanceof EmberProject.NotFoundError) {
        return Project.nullProject(_ui, _cli);
      } else {
        throw reason;
      }
    }
  }
}

function ensureUI(_ui) {
  let ui = _ui;

  if (!ui) {
    // TODO: one UI (lib/cli/index.js also has one for now...)
    const UI = require('console-ui');
    ui = new UI({
      inputStream: process.stdin,
      outputStream: process.stdout,
      ci: process.env.CI || (/^(dumb|emacs)$/).test(process.env.TERM),
      writeLevel: (process.argv.indexOf('--silent') !== -1) ? 'ERROR' : undefined,
    });
  }

  return ui;
}

function findupPath(pathName) {
  let pkgPath = findup.sync('package.json', { cwd: pathName });
  if (!pkgPath) {
    throw new EmberProject.NotFoundError(`No project found at or up from: \`${pathName}\``);
  }

  return path.dirname(pkgPath);
}

function isYarnWorkspacesProject(pkg) {
  return pkg && pkg.workspaces;
}

function isMovableCliProject(pkg) {
  return pkg && (
    (pkg.dependencies && Object.keys(pkg.dependencies).indexOf('@movable/cli') !== -1) ||
    (pkg.devDependencies && Object.keys(pkg.devDependencies).indexOf('@movable/cli') !== -1)
  );
}

module.exports = Project;
