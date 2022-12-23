const mongoose = require("mongoose");
// const client = require("../api/redis");

/**
 * Graceful Shutdown server, DB, and any other processes when we receive a SIGTERM or SIGINT event
 * */

exports.onShutdown = signal => {
  return new Promise((resolve) => {
    console.log(`${signal} received, will close the DB connection!`);
    mongoose.connection.close(false, () => {
      console.log('MongoDb connection closed.');
    });
    console.log('Cleanup finished!');
    resolve();
  });
}

exports.preShutdown = signal => {
  return new Promise((resolve) => {
    console.log(`${signal} received!`);
    console.log('Cleaning up')
    // client.quit();
    resolve();
  });
}
