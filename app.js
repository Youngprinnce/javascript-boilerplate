require('dotenv').config();
const {name} = process.env;
const path = require("path");
const jobs = require("./cron");
const express = require('express');
const expressLoader = require('./loaders/express');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

// initialize the cron cluster
if (name === 'template-server-cron') {
  for (const job in jobs) jobs[job].start();
}

expressLoader({app});

module.exports = app;