const { readProjectFile, writeProjectFile } = require("./util");

async function getDataSources(root) {
  try {
    let dataSourceData = await readProjectFile(root, ".test-data-sources.json");
    return JSON.parse(dataSourceData);
  } catch (e) {
    return [];
  }
}

async function writeDataSources(root, dataSources) {
  const dataSourceData = JSON.stringify(dataSources);
  return writeProjectFile(root, ".test-data-sources.json", dataSourceData);
}

exports.getAll = function(root) {
  return async function(req, res) {
    let dataSources = await getDataSources(root);

    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ data_sources: dataSources }));
  };
};

exports.post = function(root) {
  return async function(req, res) {
    let dataSources = await getDataSources(root);

    let newDataSource = req.body.data_source;
    newDataSource.id = dataSources[dataSources.length - 1].id + 1;
    dataSources.push(newDataSource);

    await writeDataSources(root, dataSources);

    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ data_source: newDataSource }));
  };
};

exports.put = function(root) {
  return async function(req, res, params) {
    let dataSources = await getDataSources(root);
    let dataSource = dataSources.find(d => d.id === parseInt(params.id));
    Object.keys(req.body.data_source).forEach(key => {
      dataSource[key] = req.body.data_source[key];
    });

    await writeDataSources(root, dataSources);

    res.writeHead(204, {});
    res.end();
  };
};

exports.delete = function(root) {
  return async function(req, res, params) {
    let dataSources = await getDataSources(root);
    let dataSource = dataSources.find(d => d.id === parseInt(params.id));

    let index = dataSources.indexOf(dataSource);
    dataSources.splice(index, 1);

    await writeDataSources(root, dataSources);

    res.writeHead(204, {});
    res.end();
  };
};
