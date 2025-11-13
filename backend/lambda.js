// Simple approach: Accept duplicate but use cors package properly
const { app } = require('./server');
const serverlessExpress = require('@codegenie/serverless-express');

exports.handler = serverlessExpress({ app });
