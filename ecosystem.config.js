const {argv} = process;
const env = argv.indexOf('--env') + 1;
const instances = argv[env] === 'development' ? 4 : -1;

const instanceVars = {
  max_restarts: 10,
  wait_ready: true,
  exec_mode: 'cluster',
  name: "template-ng-backend",
  script: "./bin/server.js",
  exp_backoff_restart_delay: 100,
  log_date_format: 'YYYY-MM-DD HH:mm Z',
  ignore_watch: ['node_modules', 'public'],
  env_staging: {watch: false, NODE_ENV: 'staging', instances: -1, max_memory_restart: '500M'},
  env_development: {watch: true, NODE_ENV: 'development', instances: 4, max_memory_restart: '5G'},
  env_production: {watch: false, NODE_ENV: 'production', instances: -1, max_memory_restart: '5G'},
};

module.exports = {apps: [{instances, ...instanceVars}, {instances: 1, ...instanceVars, name: 'template-server-cron'}]};
