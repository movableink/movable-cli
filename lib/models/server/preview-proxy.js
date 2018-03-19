const path = require('path');
const proxyMiddleware = require('http-proxy-middleware');
const SocketProxy = require('socketproxy');
const { Promise } = require('rsvp');
const debug = require('debug')('movable:tunnel');

const proxyUrl = 'wss://tunnel.movabledev.com';
const target = 'http://www.ink1001.com/p/lp';

/*
 * Set up a tunnel so that remote capturama can access our local assets
 *
 * And hang the tunnel URL we get off req.tunnelUrl so that preview
 * middleware can use it.
 */
exports.ensureTunnel = function(server) {
  const proxy = new SocketProxy({url: proxyUrl, app: server });
  debug(`Proxy server is at ${proxyUrl}`);

  return function findOrCreateTunnel(req, res, next) {
    const tunnelOptions = {
      port: req.socket.localPort
    };

    proxy.connect().then((proxyInfo) => {
      debug(`Proxy tunnel established, endpoint is at ${proxyInfo.uri}`);
      req.tunnelUrl = proxyInfo.uri;
      next();
    }).catch((e) => {
      debug(`Tunnel creation failed: ${e.toString()}`);
      res.writeHead(500, {});
      res.end("Failed to create preview tunnel");
    });
  };
};

/*
 * Proxy POST request to ojos
 *
 * Additionally, we want our pic.compiled_html to be resolved against
 * the tunnel URL so that capturama can access any referenced assets.
 * So we can update the pic.external_url so that the loaded page appears
 * to live on the tunnel URL.
 */
exports.preview = function() {
  return proxyMiddleware({
    target,
    ignorePath: true,
    logLevel: 'warn',
    headers: { cookie: '' },
    onProxyReq: function(proxyReq, req, res) {
      if (req.body && req.body.live_pic) {
        const body = req.body;
        delete req.body; // discard bodyParser output

        const pic = body.live_pic;
        pic.external_url = path.join(req.tunnelUrl, pic.external_url);
        const output = JSON.stringify(body);
        debug(`Rewrote POST base url to ${pic.external_url}`);

        proxyReq.setHeader('content-type', req.headers['content-type']);
        proxyReq.setHeader('content-length', output.length);

        proxyReq.write(output);
        proxyReq.end();
      } else {
        res.writeHead(500, {});
        res.end('malformed POST');
      }
    }
  });
};
