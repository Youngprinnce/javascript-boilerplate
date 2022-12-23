#!/usr/bin/env node

const http = require('http');
const app = require('../app');
const mongoose = require("mongoose");
const normalizePort = require('../utils/normalize-port');
const gracefulShutdown = require('http-graceful-shutdown');
const debug = require('debug')('template-ng-backend:server');
const {preShutdown, onShutdown} = require("../utils/graceful-shutdown");
const {NODE_ENV, DB_TEST, DB_NAME_TEST, DB_NAME_PRODUCTION, DB_PRODUCTION, PORT} = process.env;

/**
 * Module dependencies.
 */

// DB
let DB_URL, DB_NAME,
  DB_OPTIONS = {useNewUrlParser: true, useUnifiedTopology: true};
if (NODE_ENV === "development") {
  DB_URL = DB_TEST;
  DB_NAME = DB_NAME_TEST;
  DB_OPTIONS = {...DB_OPTIONS, dbName: DB_NAME};
} else {
  DB_URL = DB_PRODUCTION;
  DB_NAME = DB_NAME_PRODUCTION;
  DB_OPTIONS = {...DB_OPTIONS, dbName: DB_NAME};
}

/**
 * Get port from environment and store in Express.
 */

let port = normalizePort(PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

let server = http.createServer(app);

/**
 * Starting MongoDB Server
 * and
 * Listen on provided port, on all network interfaces.
 */
process.send = process.send || function () {};
mongoose.set('strictQuery', true)
mongoose.connect(DB_URL, DB_OPTIONS).then(() => {
  server.listen(port, err => {
    if (err) throw err;
    console.log(`DB connected, and server is on port:${port}`);
    process.send('ready');
  });
  server.on('error', onError);
  server.on('listening', onListening);
}).catch(err => console.log({err}));

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  let bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  let addr = server.address();
  let bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

gracefulShutdown(server, {
  signals: 'SIGINT SIGTERM, SIGKILL, SIGHUP',   // signals for shutting the server
  development: false,                           // not in dev mode
  forceExit: false,                             // triggers process.exit() at the end of shutdown process if true
  timeout: 10000,                               // timeout: 10 secs
  preShutdown,                                  // needed operation before httpConnections shuts down
  onShutdown,                                   // shutdown function (async) - e.g. for cleanup DB, ...
});
