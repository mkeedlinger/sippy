global.l = require('jotting');
var cf = {
    http: process.env.HTTP_PORT || 3202,
    https: process.env.HTTPS_PORT || 3203,
    root: __dirname,
    env: process.env.NODE_ENV.toLowerCase() || 'development'
};
cf.dev = (cf === 'development');

module.exports = cf;