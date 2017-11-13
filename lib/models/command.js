const Command = require("ember-cli/lib/models/command");
const EOL = require("os").EOL;

Command.prototype.printBasicHelp = function() {
  // ember command-name
  let output;
  if (this.isRoot) {
    output = `Usage: ${this.name}`;
  } else {
    output = `studio ${this.name}`;
  }

  output += this._printCommand();
  output += EOL;

  return output;
};

module.exports = Command;
