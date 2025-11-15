const { app } = require('./server');
const serverlessExpress = require('@codegenie/serverless-express');

const server = serverlessExpress({ app });

exports.handler = async (event, context) => {
  return server(event, context);
};
