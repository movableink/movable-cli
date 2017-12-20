const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");
const RSVP = require("rsvp");
const { promisify } = require("util");

const readFile = promisify(fs.readFile);

module.exports = function picApi(root) {
  function manifestAsset(assetPath, root) {
    const fullPath = path.resolve(root, assetPath);
    if (fullPath.indexOf(root) === 0 && fs.existsSync(fullPath)) {
      return readFile(fullPath).then(buffer => {
        return buffer.toString();
      });
    }
    return null;
  }

  async function loadResponse() {
    const manifestPath = path.join(root, "manifest.yml");
    const manifestData = await readFile(manifestPath);
    let manifest = yaml.safeLoad(manifestData);

    const htmlLocation = manifest.html_file || "index.html";
    const jsLocation = manifest.javascript_file || "index.js";
    const cssLocation = manifest.css_file || "style.css";

    const files = await RSVP.hash({
      html: manifestAsset(htmlLocation, root),
      javascript: manifestAsset(jsLocation, root),
      css: manifestAsset(cssLocation, root)
    });
    Object.assign(manifest, files);

    return responseObject(manifest);
  }

  return function(req, res) {
    loadResponse()
      .then(data => {
        res.end(JSON.stringify(data));
      })
      .catch(err => {
        res.writeHead(500, {});
        res.end(JSON.stringify(err));
      });
  };
};

function responseObject(manifest) {
  return {
    custom_pics: [
      {
        html: manifest.html,
        javascript: manifest.javascript,
        css: manifest.css,
        name: manifest.name,
        id: "local",
        manifest_id: 0,
        width: manifest.width,
        height: manifest.height,
        fields: manifest.fields
      }
    ],
    manifests: [
      {
        id: 0,
        html: manifest.html,
        javascript: manifest.javascript,
        css: manifest.css,
        name: manifest.name,
        advanced_options_exposed: manifest.expose_advanced_options,
        current_revision: "git",
        structure: manifest
      }
    ]
  };
}
