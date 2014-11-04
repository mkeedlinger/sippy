// depends
var express = require('express'),
    http = require('http'),
    https = require('https'),
    compression = require('compression'),
    Promise = require('bluebird'),<% if (swig) { %>
    swig = require('swig'),<% } %><% if (dbs.indexOf('redis') > 0) { %>
    redis = require('redis'),<% } %><% if (dbs.indexOf('rethinkdb') > 0) { %>
    thinky = require('thinky'),<% } %><% if (dbs.indexOf('mongodb') > 0) { %>
    mongoose = require('mongoose'),<% } %><% if (ws) { %>
    io = require('socket.io'),<% } %><% if (passport) { %>
    passport = require('passport'),<% } %>

    cf = require('./config');

// put everything together
var app = express(),
    httpServer = http.createServer(app),
    //httpsServer = https.createServer({
    //     key: require('fs').readFileSync('server.key'),
    //     cert: require('fs').readFileSync('server.cert')
    // }, app)<% if (ws) { %>,
    // wss = io(httpsServer),
    ws = io(httpServer)<% } %>;

app.use(compression());<% if (swig) { %>
swig.setDefaults({
    cache: cf.dev ? false : 'memory',
    locals: {
        getYear: function() {
            return ((new Date()).getFullYear());
        }
    }
});
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', config.root + '/html');<% } else { %>
app.use(express.static(config.root + '/html'));<% } %>
app.use(express.static(config.root + '/public'));

app.get('/', function (req, res) {
    // return the homepage<% if (swig) { %>
    res.render('index');<% } %>
});
app.get('*', function (req, res) {
    // 404 page
    res.status(400);
});

<% if (ws) { %>
ws.on('connection', function () {
    // do things with the websocket
});
// wss.on('connection', function () {
//     // do things with the secure websocket
// });<% } %>
httpServer.listen(cf.http, function () {
    l.info('HTTP server ready on port %d', cf.http);
});
httpsServer.listen(cf.https, function () {
    l.info('HTTPS server ready on port %d', cf.https);
});