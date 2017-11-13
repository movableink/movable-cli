const Project = require("ember-cli/lib/models/project");
const path = require("path");

const originalLookupPaths = Project.prototype.blueprintLookupPaths;

Project.prototype.blueprintLookupPaths = function() {
  const originalPaths = originalLookupPaths.call(this);
  return [path.join(__dirname, "../../blueprints")].concat(originalPaths);
};

module.exports = Project;
