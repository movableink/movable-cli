module.exports = function sourcemapPathTransform(src) {
  if (src.match(/^js\//)) {
    // js/*.js, relative to dist/
    return `../app/${src}`;
  } else {
    // node_modules, relative to dist/
    return src.replace(/^.*?node_modules/, '../node_modules');
  }
};
