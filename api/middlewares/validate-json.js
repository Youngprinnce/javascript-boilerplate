const {BadRequestError} = require('../../utils/api-errors');

module.exports = async (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) next(new BadRequestError);
  return next();
};
