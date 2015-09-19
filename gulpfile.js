'use strict';
var gulp = require('gulp');

gulp.task('common', ['css', 'js']);

gulp.task('default', ['common']);

gulp.task('css', function() {
	var concat = require('gulp-concat');
	var postcss = require('gulp-postcss');
	var autoprefixer = require('autoprefixer');
	// var sourcemaps   = require('gulp-sourcemaps');

	var files = [
		'css/base.css',
		'css/buttons.css',
		'css/area_button.css',
		'css/master.css',
		'css/view_switcher.css',
		'css/vkontakte_switcher.css',
		'css/search_results.css',
		'css/player.css',
		'css/buttmen.css',
		'css/play-list-panel.css',
		'css/abs_layout.css',
		'css/pv-layout.css'
	];

	return gulp.src(files)
		// .pipe(sourcemaps.init())
		.pipe( postcss([
			require('./dev/svg-mod')(),
			autoprefixer({ browsers: ['> 1%', 'opera 12'] })
		]) )
		.pipe(concat('combined.css'))
		// .pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist/'));
});

gulp.task('js', function() {
	var rjs = require('gulp-requirejs-optimize');
	// var sourcemaps = require('gulp-sourcemaps');

	var optimizerOptions = {
		packages: [
			{
				name: 'pv',
				location: 'js/libs/provoda',
				main: 'provoda'
			}
		],
		paths: {
			spv: 'js/libs/spv',
			su: 'js/seesu',
			jquery: 'js/common-libs/jquery-2.1.4.min',
			localizer: 'js/libs/localizer',
			cache_ajax: 'js/libs/cache_ajax',
			app_serv: "js/app_serv",
			view_serv: "js/views/modules/view_serv",
			env: "js/env",
			hex_md5: 'js/common-libs/md5.min',
		},
		shim: {
			hex_md5: {
				exports: 'hex_md5'
			}
		}
	};

	return gulp.src('loader.js')
		// .pipe(sourcemaps.init())
		.pipe(rjs(optimizerOptions))
		// .pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist'));
});

combo('webapp', {
	'index': function() {
		var patch = require('./dev/gulp-patch.js');

		return gulp.src('index.html')
			.pipe(patch('./src/index.html.web.patch'))
			.pipe(gulp.dest('dist-envs/webapp'));
	},
	css: [['css'], function() {
		return gulp.src('dist/combined.css')
			.pipe(gulp.dest('dist-envs/webapp/dist'));
	}],
	js: [['js'], function() {
		return gulp.src('dist/loader.js')
			.pipe(gulp.dest('dist-envs/webapp/dist'));
	}],
	images: function() {
		return gulp.src('i/**/*')
			.pipe(gulp.dest('dist-envs/webapp/i'));
	},
	'js-sep': function() {
		return gulp.src('js-sep/**/*')
			.pipe(gulp.dest('dist-envs/webapp/js-sep'));

	}
});

function combo(task, deps) {
	var array = [];

	for (var name in deps) {
		var task_name = task + '-' + name;
		var value = deps[name];
		if (Array.isArray(value)) {
			gulp.task(task_name, value[0], value[1]);
		} else {
			gulp.task(task_name, value);
		}
		array.push(task_name);
	}
	console.log(task, array);

	gulp.task(task, array);
}

gulp.task('pvclass', function() {
	var posthtml = require('./dev/gulp-posthtml');
	var pvclass = require('./dev/gulp-posthtml-pvclass.js');

	return gulp.src('index.html')
		// .pipe(sourcemaps.init())
		.pipe(posthtml([pvclass()]))
		// .pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dev-dist'));
});