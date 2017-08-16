var gulp = require('gulp');
var gutil = require('gulp-util');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var browserify = require('gulp-browserify');
var mocha = require('gulp-mocha');
var peg = require('gulp-peg');
var rename = require("gulp-rename");
var del = require('del');
// var require_js = require('gulp-requirejs');

gulp.task('clean', function(cb) {
	del(['build', 'l.js', 'l.min.js', 'src/parser.js'], cb);
});

gulp.task('parser', function(cb) {
	return gulp.src('src/parser.pegjs').pipe(
		peg().on('error', gutil.log)
	).pipe(gulp.dest('src'));
});

gulp.task('l', ['parser'], function(cb) {
	return gulp.src('src/l.js').pipe(
		browserify({standalone: 'L', debug: true})
	).pipe(gulp.dest('build'));
});

gulp.task('repl', ['l'], function(cb) {
	return gulp.src('src/repl.js').pipe(gulp.dest('build'));
});

gulp.task('build', ['l', 'repl']);

gulp.task('test', ['build'], function(cb) {
	return gulp.src('test/*.js', {read: false}).pipe(
		mocha({ui: 'bdd', 'reporter': 'list'})
	);
});

gulp.task('default', ['build']);
