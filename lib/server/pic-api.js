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
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      })
      .catch(err => {
        res.writeHead(500, {});
        res.end(JSON.stringify(err.message));
      });
  };
};

// convert time strings to milliseconds (30s -> 30000, 100ms -> 100)
function ms(value) {
  if (value && value.match(/ms$/)) {
    return parseInt(value, 10);
  } else if (value && value.match(/s$/)) {
    return parseInt(value, 10) * 1000;
  } else {
    return null;
  }
}

function responseObject(manifest) {
  const manifestRecord = Object.assign({}, manifest, {
    structure: manifest,
    current_revision: 'git',
    base: '/',
    id: 0
  });

  const {
    animation,
    beta,
    streaming,
    timeout,
    transparent,
    cache_ttl
  } = manifest.capture_options || {};

  // perform the transformations that we perform internally when creating
  // apps from a manifest
  const picRecord = Object.assign({}, manifest, {
    id: "local",
    manifest_id: 0,
    manifest_structure: manifestRecord,
    beta,
    timeout,
    ttl: cache_ttl,
    animated: !!animation,
    animation_loop: !!(animation && animation.looping),
    animation_interval: ms(animation && animation.interval),
    animation_length: ms(animation && animation['length']),
    animation_function: animation && animation.step_function,
    animation_local_palette: (animation && animation.color_palette === "local"),
    streaming,
    transparent
  });

  return {
    custom_pics: [ picRecord ],
    manifests: [ manifestRecord ]
  };
}
