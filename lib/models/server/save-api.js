const path = require("path");
const yaml = require("js-yaml");
const fs = require("fs");
const { readProjectFile, writeProjectFile } = require("./util");

module.exports = function saveManifest(root) {
  return async function(req, res) {
    let manifest = req.body.manifest;
    let structure = manifest.structure;

    const htmlLocation = structure.html_file || "index.html";
    const jsLocation = structure.javascript_file || "index.js";
    const cssLocation = structure.css_file || "style.css";

    await writeProjectFile(root, htmlLocation, manifest.html);
    await writeProjectFile(root, jsLocation, manifest.javascript);
    await writeProjectFile(root, cssLocation, manifest.css);

    delete structure.html;
    delete structure.javascript;
    delete structure.css;
    delete structure.tabs;

    const oldYaml = await readProjectFile(root, "manifest.yml");
    const newYaml = yaml.safeDump(structure, { noRefs: true });

    const outYaml = copyComments(oldYaml.toString(), newYaml);

    await writeProjectFile(root, "manifest.yml", outYaml);

    res.writeHead(204);
    res.end();
  };
};

function copyComments(oldYaml, newYaml) {
  let oldLines = oldYaml.split("\n");
  let newLines = newYaml.split("\n");

  let propertyComments = {};
  let commentList = [];
  oldLines.forEach(line => {
    if (line.match(/^#/)) {
      commentList.push(line);
    } else if (line.match(/[^\s#]+:/) && commentList.length) {
      propertyComments[line] = commentList;
      commentList = [];
    }
  });

  let result = ["---"];
  newLines.forEach(line => {
    if (propertyComments[line]) {
      result.push("");
      result = result.concat(propertyComments[line]);
      result.push(line);
      delete propertyComments[line];
    } else {
      result.push(line);
    }
  });

  return result.join("\n");
}
