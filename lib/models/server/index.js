const express = require("express");
const path = require("path");
const proxy = require("http-proxy-middleware");
const bodyParser = require("body-parser");

const appApi = require("./app-api");
const userApi = require("./user-api");
const fontApi = require("./font-api");
const picApi = require("./pic-api");
const saveApi = require("./save-api");
const dataSourceApi = require("./data-source-api");
const liveReload = require("./live-reload");

const canvasUrl = "http://localhost:8020/agile/studio";

module.exports = function(root, liveReloadPort) {
  let server = express();

  server.use(bodyParser.urlencoded({ extended: false }));
  server.use(bodyParser.json());

  server.use("/app/dist", express.static(path.join(root, "/dist")));
  server.use("/app", appApi(root));

  server.put("/api/canvas/manifests/0", saveApi(root));

  server.use("/api/canvas/users", userApi());
  server.use("/api/canvas/custom_pics/local", picApi(root));
  server.use("/api/canvas/custom_fonts", fontApi());

  server.get("/api/canvas/data_sources", dataSourceApi.getAll(root));
  server.post("/api/canvas/data_sources", dataSourceApi.post(root));
  server.put("/api/canvas/data_sources/:id", dataSourceApi.put(root));
  server.delete("/api/canvas/data_sources/:id", dataSourceApi.delete(root));

  server.use("/studio-live-reload", liveReload(liveReloadPort));

  server.use(function(req, res, next) {
    if (req.url === "/") {
      res.writeHead(302, { Location: "/dev/welcome" });
      res.end();
    } else {
      next();
    }
  });

  server.use("/", proxy({ target: canvasUrl, changeOrigin: true }));

  return server;
};
