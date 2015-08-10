var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var browserify = require('gulp-browserify');
// var require_js = require('gulp-requirejs');
var mocha = require('gulp-mocha');
var del = require('del');

gulp.task('clean', function(cb) {
	del(['build', 'l.js', 'l.min.js'], cb);
});

gulp.task('parser', function(cb) {
	return gulp.src();
});

gulp.task('build', function(cb) {
	gulp.src('src/l.js').pipe(browserify({
		insertGlobals: true,
	})).pipe(gulp.dest('./build/'));

	gulp.src('src/ell.js').pipe(gulp.dest('./build/'));
});

gulp.task('test', function(cb) {
	return gulp.src('test/*.js', {read: false}).pipe(
		mocha({ui: 'bdd', 'reporter': 'list'})
	);
});

gulp.task('default', ['build']);
