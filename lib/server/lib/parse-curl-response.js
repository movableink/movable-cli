module.exports = function parseResponse(data) {
  let headersSize = 0;

  const lines = data.split("\n");
  let headers = {};
  let status = 200;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    headersSize += line.length + 1; // length + newline

    // first line looks like "HTTP/1.1 200 OK"
    if (i === 0) {
      const [_http, _status, _msg] = line.split(" ");
      status = _status;
      if (!parseInt(status, 10)) {
        throw("Malformed sample response (see curl -i output)");
      }
      continue;
    }

    // blank line, end of headers
    if(line.trim() === '') { break; }

    // Header looks like "Authorization: 123456789"
    const [_match, key, value ] = line.match(/^([^:]+):\s*(.*)/) || [];
    if (key) {
      headers[key] = value.trim();
    }
  }

  // this is slightly better than join()ing the rest of the lines, in case
  // there is weirdness going on with binary data and/or line breaks or something
  const body = data.slice(headersSize);

  return { headers, body, status };
};
