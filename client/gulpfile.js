'use strict';

var gulp 		   = require('gulp'),
 	rename 	 		 = require('gulp-rename'),
	sourcemaps 	 = require('gulp-sourcemaps'),
	uglify 		   = require('gulp-uglify'),
  fileinclude  = require('gulp-file-include');



gulp.task('js', function () {
  gulp.src(['src/binarysocket.js'])
    .pipe(fileinclude({
        prefix: '@@',
        basepath: '@file'
    }))
    .pipe(sourcemaps.init())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./dist/'));
});

gulp.task('js-min', function () {
  gulp.src(['src/binarysocket.js'])
		.pipe(rename("binarysocket.min.js"))
    .pipe(fileinclude({
        prefix: '@@',
        basepath: '@file'
    }))
    .pipe(uglify())
    .pipe(gulp.dest('./dist/'));
});

gulp.task('watch', ['default'], function () {
  gulp.watch(['./src/*.js', './src/**/*.js'], ['js']);
});

gulp.task('default', ['js', 'js-min'], function() {

});
