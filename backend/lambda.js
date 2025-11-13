const serverlessExpress = require('@vendia/serverless-express');
const { app } = require('./server');

// Configure serverless-express
const handler = serverlessExpress({
  app,
  respondWithErrors: true,
  // Disable automatic CORS handling
  binaryMimeTypes: []
});

exports.handler = async (event, context) => {
  // Remove any automatic CORS headers from event
  if (event.headers) {
    delete event.headers['access-control-allow-origin'];
    delete event.headers['access-control-allow-methods'];
    delete event.headers['access-control-allow-headers'];
  }

  return handler(event, context);
};
