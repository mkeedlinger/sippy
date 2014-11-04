#!/usr/bin/env node
// depends
var inq = require('inquirer'),
    install = require('gulp-install'),
    fs = require('fs'),
    commander = require('commander'),
    npmApi = require('npm-web-api'),
    lodash = require('lodash'),
    async = require('async'),
    l = require('jotting'),
    bower = require('bower'),
    npm = require('npm'),

    JSONpkg = require('./package'),

    dir = process.cwd() + '/',
    src = __dirname + '/',
    templates = src + 'template/';

// tool setup
lodash.templateSettings.interpolate = /{{([\s\S]+?)}}/g;

////
// Get info
////
// CLI tools
(function () {
    var assume = "Assume the project ",
        noAsk = "Don't ask for "
    commander.version(JSONpkg.version)
    .option("-p, --publishable", assume + "will be published to npm")
    .option("-w, --websocket", assume + "uses websockets")
    .option("-s, --swig", assume + "uses swig templating")
    .option("-m, --mvc", assume + "uses MVC frameworks")
    .option("-a, --auth", assume + "uses passport authentication")
    .option("-n, --name [name]", noAsk + "a name, instead use [name]")
    .option("-d, --description [description]", noAsk + "a description, instead use [description]")
    .option("-v, --verbose", "Give more information during generation")
    // .option("-S, --silent", "Don't prompt for input") // to be implemanted later
    .parse(process.argv);
})();

// get options
if (!commander.silent) {
    inq.prompt([
        {
            type: 'input',
            name: 'name',
            message: "App name:",
            default: "MyApp"
        },
        {
            type: 'confirm',
            name: 'newFolder',
            message: 'Does Sippy need to create the project directory?',
            default: true
        },
        {
            type: 'input',
            name: 'description',
            message: 'App description',
            default: "A cool app"
        },
        {
            type: 'input',
            name: 'author',
            message: "Author (person or organization)",
            default: "John Galt"
        },
        {
            type: 'confirm',
            name: 'contrib',
            message: "Would you like to add contributers?",
            default: false
        },
        {
            type: 'confirm',
            name: 'publishable',
            message: 'Will you be publishing to NPM?',
            default: false,
            when: function (ans) {
                return (commander.private === undefined);
            }
        },
        {
            type: 'input',
            name: 'repoLink',
            message: "What's the link to the repo?",
            default: 'none',
            when: function (ans) {
                return !ans.newFolder;
            }
        },
        {
            type: 'input',
            name: 'repoType',
            message: "What type of repo is it?",
            default: "git",
            when: function (ans) {
                return ans.repoLink !== 'none' && ans.repoLink !== undefined;
            }
        },
        {
            type: 'checkbox',
            name: 'dbs',
            message: "Which databases will you need support for?",
            choices: ['redis', 'rethinkdb', 'mongodb']
        },
        {
            type: 'confirm',
            name: 'ws',
            message: 'Do you need WebSockets support?',
            default: false
        },
        {
            type: 'confirm',
            name: 'swig',
            message: 'Do you need swig templates?',
            default: true
        },
        {
            type: 'confirm',
            name: 'mvc',
            message: 'Do you need MV* frameworks?',
            default: false,
            when: function (ans) {
                return ans.swig;
            }
        },
        {
            type: 'confirm',
            name: 'passport',
            message: 'Will you be using passport for auth?',
            default: false
        },
        {
            type: 'list',
            name: 'cssF',
            message: "Which CSS framework will you use?",
            default: 'foundation',
            choices: [
                'foundation',
                'bootstrap',
                {
                    name: 'none',
                    value: 0
                }
            ]
        },
        {
            type: 'confirm',
            name: 'sass',
            message: "Will you be using SASS?",
            default: true,
            when: function (ans) {
                return ans.cssF !== 'foundation';
            }
        }],
        configure);
} else {
    configure({});
}

////
// configure
////
function configure (a) {
    var attention = [],
        depends = ['express', 'jotting', 'compression', 'bluebird', 'jotting'],
        devDepends = ['gulp', 'gulp-bump', 'browser-sync',
            'gulp-nodemon', 'gulp-notify', 'gulp-sass', 'gulp-uglify'],
        pkg = {
            name: a.name,
            description: a.description,
            author: a.author,
            private: !a.publishable,
            version: "0.1.0"
        },
        bowerPkg = {
            name: a.name,
            version: "0.1.0"
        },
        bowerDepends = ['jquery', 'lodash'];

    ////
    // situations
    ////
    if (a.newFolder) {
        dir += (a.name + '/');
        fs.mkdirSync(dir);
        process.chdir(dir);
    }
    // mkdirs
    fs.mkdirSync(dir + 'public');
    fs.mkdirSync(dir + 'public/css');
    fs.mkdirSync(dir + 'public/js');
    fs.mkdirSync(dir + 'public/img');
    fs.mkdirSync(dir + 'html');
    if (a.sassF !== 0 || a.sass) {
        fs.mkdirSync(dir + 'scss');
    } else {
        fs.mkdirSync(dir + 'css');
    }
    if (a.swig) {
        fs.mkdirSync(dir + 'html/layouts');
        template('html/layouts/main.html', a);
        depends.push('swig');
    }
    if (a.repoLink !== 'none' && a.repoLink !== undefined) {
        pkg.repository = {
            type: a.repoType,
            url: a.repoLink
        }
    }
    if (a.contrib) {
        pkg.contributers = [
            {
                name: "<Example Person>",
                email: "<person@example.com>"
            }
        ];
        attention.push({file: 'package.json', reason: 'Contributers must be edited'});
    }
    if (a.dbs.indexOf('redis') > 0) {
        depends.push('redis');
    }
    if (a.dbs.indexOf('rethinkdb') > 0) {
        depends.push('thinky');
    }
    if (a.dbs.indexOf('mongodb') > 0) {
        depends.push('mongoose');
    }
    if (a.ws) {
        depends.push('socket.io');
    }
    if (a.mcv) {
        l.warn('Sorry, support for MVCs is not yet added :(');
    }

    ////
    // always happens
    ////
    template('README.md', a);
    template('app.js', a);
    template('gulpfile.js', a);
    template('html/index.html', a);

    l.info('Please wait...');
    getNpmVersion(depends, function (ver) {
        pkg.dependancies = ver;
        getNpmVersion(devDepends, function (vers) {
            pkg.devDependancies = vers;
            pkg = JSON.stringify(pkg, null, 4);
            bowerPkg = JSON.stringify(bowerPkg, null, 4);
            fs.writeFileSync(dir + 'package.json', pkg);
            fs.writeFileSync(dir + 'bower.json', bowerPkg);
            bower.commands.install(bowerDepends, {save: true}).on('end', function () {
                npm.load({}, function (er) {
                    if (er) {
                        l.error(er);
                    }
                    npm.commands.install(depends, function (er, data) {
                        if (er) {
                            l.error(er);
                        }
                        l.info('Your stack has been successfully generated!');
                    });
                });
            });
        });
    });
}

////
// functions
////
function template (location, ans) {
    fs.writeFileSync(
        dir + location,
        lodash.template(fs.readFileSync(templates + location).toString(), ans)
    );
}
function getNpmVersion (dependancies, cb) {
    var versions = {};
    async.each(dependancies, function (d, done) {
        npmApi.getLatest(d, function (err, body) {
            if (err) {
                done(err);
            } else {
                versions[d] = '~' + body.version;
                done();
            }
        });
    }, function (err) {
        if (err) {
            l.error('Getting the versions numbers of the dependancies failed!');
            process.exit(1);
        } else {
            cb(versions);
        }
    })
}