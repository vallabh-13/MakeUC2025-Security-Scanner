const awsServerlessExpress = require('aws-serverless-express');
const { app, server } = require('./server');

// NOTE: If you get ERR_CONTENT_DECODING_FAILED in your browser, this is likely due to
// a compressed response (e.g. gzip) which has been incorrectly handled by aws-serverless-express
// and/or API Gateway. Add the following line to your serverless.yml to fix this:
// apigateway: { binaryMediaTypes: ['*/*'] }
const serverProxy = awsServerlessExpress.createServer(app);

exports.handler = (event, context) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);
  awsServerlessExpress.proxy(serverProxy, event, context);
};
