class APIError extends Error {
  constructor(status, message) {
    super();
    this.status = status;
    this.message = message.includes('Cast to ObjectId failed') ? 'you have entered an invalid id'
      : message.includes('Cast to Decimal128 failed') ? `There's a problem with user's data, refer to webmaster.` : message;
  }
}

const apiErrors = Object.entries({
  BadRequest: {
    statusCode: 400,
    message: 'Bad Request',
  },
  Unauthorized: {
    statusCode: 401,
    message: 'Unauthorized',
  },
  AccessDeniedError: {
    statusCode: 401,
    message: 'Access denied',
  },
  Forbidden: {
    statusCode: 403,
    message: 'Forbidden',
  },
  NotFound: {
    statusCode: 404,
    message: 'Not found',
  },
  MethodNotAllowed: {
    statusCode: 405,
    message: 'Method Not Allowed',
  },
  TimeoutError: {
    statusCode: 408,
    message: 'Request timeout',
  },
  Conflict: {
    statusCode: 409,
    message: 'Conflict',
  },
  UnSupportedMediaType: {
    statusCode: 415,
    message: 'Unsupported Media Type',
  },
  ExpectationFailed: {
    statusCode: 417,
    message: 'Expectation Failed',
  },
  UnProcessableEntity: {
    statusCode: 422,
    message: 'Unprocessable Entity',
  },
  InternalServer: {
    statusCode: 500,
    message: 'Internal Server Error',
  },
}).reduce((map, [name, data]) => {
  map[`${name}Error`] = map[name] = class extends APIError {
    constructor(message = data.message) {
      super(data.statusCode, message);
    }
  };

  return map;
}, {});

module.exports = {
  ...apiErrors,
  APIError,
};
