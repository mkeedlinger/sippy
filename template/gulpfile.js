var // Core
    gulp = require('gulp'), // The main gulp module
    nodemon = require('gulp-nodemon'),
    uglify = require('gulp-uglify'),
    browserSync = require('browser-sync'),
    sass = require('gulp-sass'), // Compile SASS files
    notify = require('gulp-notify'),
    config = require('./config');

gulp.task('default', ['js', 'sass', 'watch'], function () {
    console.log(
        "[IMPORTANT] ".red + "Make sure to run 'gulp prod' "
        + "to ready master branch"
    );
});
gulp.task('sass', function () {
    gulp.src('./scss/*.scss')
        .pipe(sass({
            outputStyle: 'nested',
            errLogToConsole: false,
            onError: function (msg) {
                notify().write('[SASS error] ' + msg);
                console.log('SASS problem:', msg);
            }
        }))
        .pipe(gulp.dest('./public/css'))
        .pipe(browserSync.reload({stream:true}));
});
gulp.task('prod', function () {
    gulp.src('./scss/*.scss')
        .pipe(sass({
            outputStyle: 'compressed',
            errLogToConsole: true
        }))
        .pipe(gulp.dest('./public/css'));
    gulp.src('./js/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('./public/js'));
    console.log(
        "[IMPORTANT] ".red + ("To master branch commit:\n" + "            "
        + "- 'git add' contents of './public/js/', './public/css/'").yellow
    );
});
gulp.task('js', function () {
    gulp.src('./js/*.js')
        .pipe(gulp.dest('./public/js'))
        .pipe(browserSync.reload({stream:true}));
});
gulp.task('watch', function () {
    gulp.watch(['./scss/*.scss', './scss/depends/*.scss'], ['sass']);
    gulp.watch(
        ['./swig/*.html', './server.js', 'config.js'],
        waitReload
    );
    gulp.watch('./js/*.js', ['js']);
    nodemon({
        script: 'server.js',
        ext: 'html js json',
        ignore: ['js/', 'bower_components/', 'node_modules/', 'public/',
        'sass/', 'swig/', 'gulpfile.js']
    });
    setTimeout(function () {
        browserSync({
            proxy: "localhost:3000",
            port: 3001
        });
    }, 1050);
});

function waitReload () {
    setTimeout(browserSync.reload, 1000);
}