const url = require('url');
const yaml = require("js-yaml");
const parseCurlResponse = require('./lib/parse-curl-response');
const manifestFile = require('./lib/manifest-file');
const dataSourcePreviewer = require('./lib/data-source-previewer');

async function getDefinitions(root) {
  const manifestData = await manifestFile("manifest.yml", root);
  let manifest = yaml.safeLoad(manifestData);

  return manifest.data_source_definitions;
}

async function getDataSources(root) {
  const definitions = await getDefinitions(root);
  let counter = 0;

  return Object.entries(definitions).reduce((sources, [templateType, definition]) => {
    const samples = definition.sample_responses || [];
    samples.forEach(sample => {
      const key = `sample-${encodeURIComponent(sample.name)}`;
      const id = counter++;
      sources.push(Object.assign({}, sample, {
        name: `Sample: ${sample.name}`,
        type: 'ApiDataSource',
        id,
        key,
        url: '/not-real',
        template_type: templateType
      }));
    });

    const id = (counter++) + 1000;
    const key = templateType;
    sources.push(Object.assign({}, definition, {
      id,
      key,
      template_type: templateType
    }));

    return sources;
  }, []);
}

async function getDataSourcePreview(key, root, params) {
  const dataSources = await getDataSources(root);
  const dataSource = dataSources.find(d => d.key === key);

  return dataSource && dataSourcePreviewer(dataSource, params);
}

async function getDataSourceSample(key, root) {
  const dataSources = await getDataSources(root);
  const dataSource = dataSources.find(d => d.key === key);

  return dataSource && manifestFile(dataSource.path, root);
}

exports.listDataSources = function(root) {
  return function(req, res, next) {
    getDataSources(root).then((dataSources) => {
      res.end(JSON.stringify({ data_sources: dataSources }));
    }).catch((e) => {
      res.writeHead(500, {});
      res.end("Server error");
    });
  };
};

exports.getDataSource = function(root) {
  return async function(req, res, next) {
    try {
      const { query, pathname } = url.parse(req.url, true);
      const key = decodeURIComponent(pathname.slice(1));

      let data;
      if (key.startsWith('sample-')) {
        const data = await getDataSourceSample(key, root);
        if(data) {
          const { headers, body, status } = parseCurlResponse(data);
          res.writeHead(status, headers);
          res.end(body);
        } else {
          res.writeHead(404, {});
          res.end('404 not found');
        }
      } else {
        const { response, body } = await getDataSourcePreview(key, root, query);
        res.writeHead(response.statusCode, response.headers);
        res.end(body);
      }
    } catch (e) {
      res.writeHead(500, {});
      res.end(JSON.stringify({ error: e.toString() }));
    }
  };
};
