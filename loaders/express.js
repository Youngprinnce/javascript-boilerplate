const cors = require('cors');
const {NODE_ENV} = process.env;
const morgan = require('morgan');
const express = require('express');
const enforce = require('express-sslify');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const {errorHandler, notFoundHandler, badJsonHandler, timedout} = require("../api/middlewares");

module.exports = ({app}) => {
  /**
   * Middlewares
   */
  app.use(timedout);
  app.use(express.json());
  app.use(cookieParser());
  app.disable('x-powered-by');
  app.use(bodyParser.json({limit: "20mb"}));
  app.use(express.urlencoded({extended: false}));
  app.use(cors({origin: true, credentials: true}));
  app.use(bodyParser.urlencoded({extended: true, limit: "20mb"}));
  app.use(morgan(NODE_ENV !== 'development' ? 'combined' : 'dev'));

  /**
   * Enforce SSL for Heroku
   * */
  if (NODE_ENV !== 'development') app.use(enforce.HTTPS({trustProtoHeader: true}));

  /**
   * handle bad json format
   */
  app.use(badJsonHandler);

  /**
   * APIs
   */
  require('../v1.routes')({app});
  require('../api/v1/doc/v1.doc')({app});

  /**
   * Catch 404 and forward to error handle.
   */
  app.use(notFoundHandler);

  /**
   * Global error catcher.
   */
  app.use(errorHandler);
};
