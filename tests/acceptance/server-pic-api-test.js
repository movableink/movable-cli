const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../lib/server/index');
const path = require('path');
const tmp = require('ember-cli-internal-test-helpers/lib/helpers/tmp');
const Promise = require('rsvp');
const fs = require('fs-extra');
const copy = Promise.denodeify(fs.copy);
const express = require('express');

chai.use(chaiHttp);
const { expect } = chai;

let rootPath = process.cwd();
let tmpPath = 'tmp';

const app = express();
server(app, {
  project: {
    root: path.resolve('tmp')
  },
  liveReloadPort: 9999
});

async function setupManifest(name) {
  await copy(path.join(rootPath, 'tests', 'data', 'style.css'),
             path.join(tmpPath, 'style.css'),
             { clobber: true });
  await copy(path.join(rootPath, 'tests', 'data', 'manifests', name),
             path.join(tmpPath, 'manifest.yml'),
             { clobber: true });
}

describe('Acceptance: server/pic-api', function() {
  it('returns animated properties from the manifest when they are set', async function() {
    await setupManifest('simple.yml');

    const res = await chai.request(app).get('/api/canvas/custom_pics/local');

    expect(res.body.manifests.length).to.eq(1);
    expect(res.body.manifests[0].name).to.eq('Simple');
    expect(res.body.custom_pics.length).to.eq(1);
    expect(res.body.custom_pics[0].name).to.eq('Simple');
    expect(res.body.custom_pics[0].css.trim()).to.eq('html { color: green; }');
    expect(res.body.custom_pics[0].animated).to.eq(false);
  });

  it('returns animated properties from advanced manifests', async function() {
    await setupManifest('countdown.yml');
    const res = await chai.request(app).get('/api/canvas/custom_pics/local');

    expect(res.body.custom_pics.length).to.eq(1);
    expect(res.body.custom_pics[0].name).to.eq('Countdown Timer (beta)');
    expect(res.body.custom_pics[0].animated).to.eq(true);
    expect(res.body.custom_pics[0].animation_length).to.eq(30000);
    expect(res.body.custom_pics[0].animation_function).to.eq('requestCapturamaFrame();');
  });
});
