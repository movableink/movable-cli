const url = require('url');
const yaml = require("js-yaml");
const parseCurlResponse = require('./lib/parse-curl-response');
const manifestFile = require('./lib/manifest-file');

async function getDefinitions(root) {
  const manifestData = await manifestFile("manifest.yml", root);
  let manifest = yaml.safeLoad(manifestData);

  return manifest.data_source_definitions;
}

async function getSampleDataSources(root) {
  const definitions = await getDefinitions(root);

  return Object.entries(definitions).reduce((sources, [templateType, definition]) => {
    const samples = definition.sample_responses || [];
    samples.forEach(sample => {
      sources.push(Object.assign({}, sample, {
        type: 'ApiDataSource',
        id: sample.name,
        key: encodeURIComponent(sample.name),
        url: '/not-real',
        template_type: templateType
      }));
    });

    return sources;
  }, []);
}

exports.listDataSources = function(root) {
  return function(req, res, next) {
    getSampleDataSources(root).then((dataSources) => {
      res.end(JSON.stringify({ data_sources: dataSources }));
    }).catch((e) => {
      res.writeHead(500, {});
      res.end("Server error");
    });
  };
};

exports.getDataSource = function(root) {
  return function(req, res, next) {
    const requestPath = url.parse(req.url).pathname;
    const name = decodeURIComponent(requestPath.slice(1));

    getSampleDataSources(root).then((dataSources) => {
      const dataSource = dataSources.find(d => d.name === name);
      if (dataSource) {
        return manifestFile(dataSource.path, root);
      }
    }).then((data) => {
      if(data) {
        const { headers, body, status } = parseCurlResponse(data);
        res.writeHead(status, headers);
        res.end(body);
      } else {
        res.writeHead(404, {});
        res.end('404 not found');
      }
    }).catch((e) => {
      res.writeHead(500, {});
      res.end(JSON.stringify({ error: e.toString() }));
    });
  };
};
