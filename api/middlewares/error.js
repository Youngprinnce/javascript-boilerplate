const {APIError} = require('../../utils/api-errors');

module.exports = async (err, req, res, next) => {
  // log any kind of error
  const errorData = {
    date: new Date().toISOString(), env: process.env.NODE_ENV, statusCode: err.status,
    level: 'error', body: req.body, name: err.name, message: err.message, api: req.url,
    method: req.method, client: req.ip, stack: err.stack, cookies: req.cookies, headers: req.headers,
  };

  // log error to the console
  console.error(errorData);

  // If response is already sent, don't attempt to respond to client
  if (res.headersSent) return next(err);

  // catch all else api errors
  if (err instanceof APIError) return res.status(err.status).send({success: false, message: err.message});

  // connect all errors
  return res.status(500).send({success: false, message: 'Something went wrong!'});
};
