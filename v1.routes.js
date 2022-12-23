const glob = require('glob');
const path = require("path");

/**
 * Mounts all routes defined in *.route.js files in server/
 */
const mountRoutes = () => {
  const routes = [];
  // Route definitions
  const files = glob.sync(`api/v1/**/*.route.js`);

  // Mount routes for each file
  files.forEach((routeFilename) => {
    const version = routeFilename.split('api')[1].split('components')[0];

    // Create the url using the version, and the first part of the filename
    // e.g. auth.route.js will generate /v1/auth
    const routeName = path.basename(routeFilename, '.route.js');

    routes.push({url: `${version}${routeName}`, route: require(`./${routeFilename}`)});
  });
  return routes;
}

// Gets all routes versions
module.exports = getRoutes = ({app}) => mountRoutes().map(({url, route}) => app.use(url, route));
