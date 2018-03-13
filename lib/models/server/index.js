const express = require("express");
const path = require("path");
const proxy = require("http-proxy-middleware");
const bodyParser = require("body-parser");

const appApi = require("./app-api");
const userApi = require("./user-api");
const fontApi = require("./font-api");
const picApi = require("./pic-api");
const saveApi = require("./save-api");
const assetsApi = require("./assets-api");
const campaignPicsApi = require("./campaign-pics-api");
const dataSourceApi = require("./data-source-api");
const versionApi = require("./version-api");
const liveReload = require("./live-reload");

const canvasUrls = {
  staging: "https://s3.amazonaws.com/movableink-canvas-staging/index.html",
  development: "http://movableink.localhost:8020/index.html"
};

const environment = process.env.MOVABLE_ENV || "staging";
const canvasUrl = canvasUrls[environment];

module.exports = function(root, liveReloadPort) {
  let server = express();

  server.use(bodyParser.urlencoded({ extended: false, limit: '20mb' }));
  server.use(bodyParser.json({limit: '20mb'}));

  server.get("/app", appApi(root));
  server.post("/app", appApi(root));
  server.use("/app/dist", express.static(path.join(root, "/dist")));
  server.use("/app/", express.static(path.join(root, "/app")));

  server.put("/api/canvas/manifests/0", saveApi(root));

  server.use("/api/canvas/users", userApi());
  server.use("/api/canvas/custom_pics/local", picApi(root));
  server.use("/api/canvas/custom_fonts", fontApi());
  server.use("/api/canvas/assets", assetsApi(root));
  server.use("/api/canvas/campaign_pics", campaignPicsApi());

  server.get("/api/canvas/data_sources", dataSourceApi.getAll(root));
  server.post("/api/canvas/data_sources", dataSourceApi.post(root));
  server.put("/api/canvas/data_sources/:id", dataSourceApi.put(root));
  server.delete("/api/canvas/data_sources/:id", dataSourceApi.delete(root));

  server.get("/api/version", versionApi());
  server.use("/studio-live-reload", liveReload(liveReloadPort));

  server.use(function(req, res, next) {
    if (req.url === "/") {
      res.writeHead(302, { Location: "/dev/welcome" });
      res.end();
    } else {
      next();
    }
  });

  const canvasProxy = proxy({
    target: canvasUrl,
    changeOrigin: true,
    ignorePath: true,
    logLevel: "warn"
  });

  server.use("/", canvasProxy);

  return server;
};
