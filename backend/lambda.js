// Manual Lambda handler without serverless-express to avoid CORS duplication
const { app } = require('./server');
const http = require('http');

// Create HTTP server
const server = http.createServer(app);

// Start server on a local port
const PORT = 3000;
server.listen(PORT);

exports.handler = async (event, context) => {
  // Convert Lambda event to HTTP request format
  const { httpMethod, path, queryStringParameters, headers, body, isBase64Encoded } = event;

  // Make HTTP request to local server
  const options = {
    hostname: 'localhost',
    port: PORT,
    path: path + (queryStringParameters ? '?' + new URLSearchParams(queryStringParameters).toString() : ''),
    method: httpMethod,
    headers: headers || {}
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        // Convert HTTP response to Lambda response format
        const response = {
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          isBase64Encoded: false
        };

        // Ensure only ONE CORS header
        if (response.headers) {
          // Remove duplicate CORS headers
          const corsValue = response.headers['access-control-allow-origin'];
          if (Array.isArray(corsValue)) {
            response.headers['access-control-allow-origin'] = corsValue[0];
          }
        }

        resolve(response);
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(isBase64Encoded ? Buffer.from(body, 'base64').toString() : body);
    }

    req.end();
  });
};
