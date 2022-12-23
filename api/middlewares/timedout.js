const {TimeoutError} = require("../../utils/api-errors");

module.exports = (req, res, next) => {
  // keep the connection alive for 29.5 seconds before throwing timedout error, to mitigate Heroku time out limit of 30s
  res.setTimeout(1000 * 29.5, () => next(new TimeoutError('your internet connectivity is slow, try again')));
  next();
};
