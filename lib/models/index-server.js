const express = require("express");
const path = require("path");
const proxy = require("http-proxy-middleware");
const fs = require("fs");
const yaml = require("js-yaml");
const RSVP = require("rsvp");
const { promisify } = require("util");

const readFile = promisify(fs.readFile);

const canvasUrl = "http://localhost:8020/agile/studio";

function userApi() {
  return function(req, res) {
    res.end(
      JSON.stringify({
        companies: [{ id: 0, name: "Local", products: { live_content: true } }],
        user: { name: "Local User", company_id: 0, id: "me", features: {} }
      })
    );
  };
}

function fontApi() {
  return function(req, res) {
    res.end("[]");
  };
}

function manifestAsset(assetPath, root) {
  const fullPath = path.resolve(root, assetPath);
  if (fullPath.indexOf(root) === 0 && fs.existsSync(fullPath)) {
    return readFile(fullPath).then(buffer => {
      return buffer.toString();
    });
  }
  return null;
}

function picApi(root) {
  return function(req, res) {
    let manifest;
    try {
      const manifestPath = path.join(root, "manifest.yml");
      const manifestData = fs.readFileSync(manifestPath);
      manifest = yaml.safeLoad(manifestData);
      console.log(manifest);
    } catch (e) {
      res.writeHead(500, {});
      res.end("Error parsing manifest.yaml");
    }
    const htmlLocation = manifest.html_file || "index.html";
    const jsLocation = manifest.javascript_file || "index.js";
    const cssLocation = manifest.css_file || "style.css";

    RSVP.hash({
      html: manifestAsset(htmlLocation, root),
      javascript: manifestAsset(jsLocation, root),
      css: manifestAsset(cssLocation, root)
    })
      .then(files => {
        res.end(
          JSON.stringify({
            custom_pics: [
              {
                html: files.html,
                javascript: files.javascript,
                css: files.css,
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
                html: files.html,
                javascript: files.javascript,
                css: files.css,
                name: manifest.name,
                advanced_options_exposed: manifest.expose_advanced_options,
                current_revision: "git",
                structure: manifest
              }
            ]
          })
        );
      })
      .catch(e => {
        res.writeHead(500, {});
        res.end(e.toString());
      });
  };
}

module.exports = function(root) {
  let server = express();

  server.use("/app/dist", express.static(path.join(root, "/dist")));
  server.use("/app", function(req, res) {
    res.sendFile(path.join(root, "index.html"));
  });

  server.use("/api/canvas/users", userApi());
  server.use("/api/canvas/custom_pics/local", picApi(root));
  server.use("/api/canvas/custom_fonts", fontApi());

  server.use("/", proxy({ target: canvasUrl, changeOrigin: true }));

  return server;
};
