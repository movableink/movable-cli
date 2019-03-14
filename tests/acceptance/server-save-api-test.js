const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../../lib/server/index");
const path = require("path");
const Promise = require("rsvp");
const fs = require("fs-extra");
const copy = Promise.denodeify(fs.copy);

chai.use(chaiHttp);
const { expect } = chai;

let rootPath = process.cwd();
let tmpPath = "tmp";

const app = server(path.resolve(tmpPath), 9999);

function manifestPath(fileName) {
  return path.join(rootPath, "tests", "data", "manifests", fileName);
}

function appPath(fileName) {
  return path.join(tmpPath, fileName);
}

async function setupManifest(name, targetName) {
  await copy(manifestPath(name), appPath(targetName), {
    clobber: true
  });
}

describe("Acceptance: server/save-api", function() {
  beforeEach(async () => {
    await fs.remove('tmp');
  });

  it("saves changes to the manifest", async function() {
    await setupManifest("simple.yml", "manifest.yml");

    await chai
      .request(app)
      .put("/api/canvas/manifests/0")
      .send({ manifest: { structure: { yaml: true } } });

    const contents = fs.readFileSync(appPath('manifest.yml'));

    expect(contents.toString()).to.eq("---\nyaml: true\n");
  });

  it("saves changes to the app-manifest if present, leaving manifest unchanged", async function() {
    await setupManifest("simple.yml", "manifest.yml");
    await setupManifest("simple.yml", "app-manifest.yml");

    const ogManifest = fs.readFileSync(appPath('manifest.yml'));

    await chai
      .request(app)
      .put("/api/canvas/manifests/0")
      .send({ manifest: { structure: { yaml: true } } });

      const afterManifest = fs.readFileSync(appPath('manifest.yml'));
      const appManifest = fs.readFileSync(appPath('app-manifest.yml'));

      expect(appManifest.toString()).to.eq("---\nyaml: true\n");
      expect(ogManifest.toString()).to.eq(afterManifest.toString());
  });
});
