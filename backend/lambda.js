const serverlessExpress = require('@vendia/serverless-express');
const { app } = require('./server');

// Configure to not add automatic CORS headers
exports.handler = serverlessExpress({ app });
