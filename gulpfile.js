var gulp = require('gulp');
var gutil = require('gulp-util');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var browserify = require('gulp-browserify');
// var require_js = require('gulp-requirejs');
var mocha = require('gulp-mocha');
var peg = require('gulp-peg');
var rename = require("gulp-rename");
var del = require('del');

gulp.task('clean', function(cb) {
	del(['build', 'l.js', 'l.min.js', 'src/parser.js'], cb);
});

gulp.task('parser', function(cb) {
	gulp.src('src/l.pegjs').pipe(
		peg({exportVar: 'L.Parser'}).on('error', gutil.log)
	).pipe(
		rename('parser.js')
	).pipe(gulp.dest('src'));
	//TODO: Interpolate with the following:
	// var L = {};
	// L.AST = require('./ast')
	//
	// // BEGIN(BROWSER)
	// *** PARSER GOES HERE ***
	// // END(BROWSER)
	// module.exports = L;
});

gulp.task('build', ['parser'], function(cb) {
	gulp.src('src/l.js').pipe(
		browserify({insertGlobals: true})
	).pipe(gulp.dest('build'));

	gulp.src('src/ell.js').pipe(gulp.dest('build'));
});

gulp.task('test', ['build'], function(cb) {
	return gulp.src('test/*.js', {read: false}).pipe(
		mocha({ui: 'bdd', 'reporter': 'list'})
	);
});

gulp.task('default', ['build']);
