/* eslint-disable strict */
'use strict';
var gulp = require('gulp');
var foreach = require("gulp-foreach");
var path = require('path');

gulp.task('index', function() {
	var fileinclude = require('gulp-file-include');
	var deinline = require('./dev/gulp-extract-html-style');

	return gulp.src('./src/index.html')
		.pipe(fileinclude({
			indent: true,
			prefix: '<!--import-',
			suffix: '-->'
		}))
		.pipe(deinline({noInject: true}))
		.pipe(foreach(function(stream, f) {
			if (path.basename(f.path) == 'index.html') {
				return stream.pipe(gulp.dest('./'));
			} else {
				return stream.pipe(gulp.dest('./dist-envs/temp'));
			}
		}));
});

// gulp.task('css-deinline', function() {

// 	return gulp.src('./index.html')
// 		;
// });


gulp.task('css', gulp.parallel(['index'], function() {
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
		'css/player.css',
		'css/song-image-con.css',
		'css/abs_layout.css',
		'css/pv-layout.css',
		'dist-envs/temp/uninlined.css'
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
}));

gulp.task('js', function() {
	var rjs = require('gulp-requirejs-optimize');
	// var sourcemaps = require('gulp-sourcemaps');

	var optimizerOptions = {
		paths: {
			jquery: 'js/common-libs/jquery-2.1.4.min',
			angbo: 'js/libs/provoda/StatementsAngularParser.min',
		},
		map: {
			'*': {
				su: 'js/seesu',

				pv: 'js/libs/provoda/provoda',
				View: 'js/libs/provoda/View',

				spv: 'js/libs/spv',
				app_serv: "js/app_serv",
				localizer: 'js/libs/localizer',
				view_serv: "js/views/modules/view_serv",
				cache_ajax: 'js/libs/cache_ajax',
				env: "js/env",

				hex_md5: 'js/common-libs/md5',
				'Promise': 'js/common-libs/Promise-3.1.0.mod'
			}
		}
	};

	return gulp.src('loader.js')
		// .pipe(sourcemaps.init())
		.pipe(rjs(optimizerOptions))
		// .pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist'));
});

gulp.task('common', gulp.parallel(['css', 'js' , 'index']));

gulp.task('default', gulp.parallel(['common']));


combo('webapp', extend(common('webapp'), {
	'index': [['index'], function() {
		var patch = require('./dev/gulp-patch.js');

		gulp.src('index.html')
			.pipe(patch('./src/index.dist-js.patch'))
			.pipe(patch('./src/webapp/index.html.patch'))
			.pipe(gulp.dest('dist-envs/webapp'));
	}]
}));

combo('chrome_app', extend(common('chrome_app'), {
	'index': [['index'], patch(
		'index.html', './src/index.dist-js.patch',
		'dist-envs/chrome_app')],
	'manifest': copy(
			'manifest.json', 'dist-envs/' + 'chrome_app'),
	icons: copy('icons/**/*', 'dist-envs/' + 'chrome_app' + '/icons'),
	_locales: copy('_locales/**/*', 'dist-envs/' + 'chrome_app' + '/_locales')
}));
combo('chrome_popup', chromeExtension('chrome_popup'));
combo('opera_popup', extend(chromeExtension('opera_popup'), {
	'config.xml': copy(
		'./src/opera_popup/config.xml',
		'dist-envs/' + 'opera_popup'
	),
	'background': copy(
		'./src/opera_popup/bg.html',
		'dist-envs/' + 'opera_popup'
	),
	'js': copy('js/**/*', 'dist-envs/' + 'opera_popup' + '/js'),
	'js-loader': copy(
		'./loader.js',
		'dist-envs/' + 'opera_popup'
	),
}));

gulp.task('chrome_app-zipped', gulp.parallel(['chrome_app'], function () {
	var zip = require('gulp-zip');
	return gulp.src('dist-envs/' + 'chrome_app/**')
		.pipe(zip('chrome_app.zip'))
		.pipe(gulp.dest('dist-envs'));
}));
gulp.task('chrome_popup-zipped', gulp.parallel(['chrome_popup'], function () {
	var zip = require('gulp-zip');
	return gulp.src('dist-envs/' + 'chrome_popup/**')
		.pipe(zip('chrome_popup.zip'))
		.pipe(gulp.dest('dist-envs'));
}));
gulp.task('opera_popup-zipped', gulp.parallel(['opera_popup'], function () {
	var zip = require('gulp-zip');
	return gulp.src('dist-envs/' + 'opera_popup/**')
		.pipe(zip('opera_popup.zip'))
		.pipe(gulp.dest('dist-envs'));
}));

gulp.task('envs', gulp.parallel(['chrome_app-zipped', 'chrome_popup-zipped', 'opera_popup-zipped', 'webapp']));


function chromeExtension(dest_env) {
	var dest_folder = 'dist-envs/' + dest_env;
	return extend(common(dest_env), {
/*		index.html
		manifest.json
		/_locales/en/messages.json
		_locales/ru/messages.json

		bg.html
		ui-init.js
*/
		'index': [['index'], patch(
			'index.html', './src/chrome_popup/index.html.patch',
			dest_folder)],
		'manifest': patch(
			'manifest.json', './src/chrome_popup/manifest.json.patch',
			dest_folder),
		'locales-en': patch(
			'./_locales/en/messages.json',
			'./src/chrome_popup/_l-en-messages.json.patch',
			dest_folder + '/_locales/en/'
		),
		'locales-ru': patch(
			'./_locales/ru/messages.json',
			'./src/chrome_popup/_l-ru-messages.json.patch',
			dest_folder +'/_locales/ru/'
		),

		icons: copy('icons/**/*', dest_folder + '/icons'),

		'background': copy('./src/chrome_popup/bg.html', dest_folder),
		'ui-init': copy('./src/chrome_popup/ui-init.js', dest_folder),
	});
}

function patch(source, patch_path, dest) {
	return function() {
		var patch = require('./dev/gulp-patch.js');

		return gulp.src(source)
			.pipe(patch(patch_path))
			.pipe(gulp.dest(dest));
	};
}

function copy(source, dest) {
	return function() {
		return gulp.src(source)
			.pipe(gulp.dest(dest));
	};
}

function common(env) {
	return {
		index: [['index']],
		css: [['css'],
			copy('dist/combined.css', 'dist-envs/' + env + '/dist')],
		js: [['js'],
			copy('dist/loader.js', 'dist-envs/' + env + '/dist')],
		images: copy('i/**/*', 'dist-envs/' + env + '/i'),
		'js-sep': copy('js-sep/**/*', 'dist-envs/' + env + '/js-sep')
	};
}

function combo(task, deps) {
	var array = [];

	for (var name in deps) {
		var task_name = task + '-' + name;
		var value = deps[name];
		if (Array.isArray(value)) {
			gulp.task(task_name, gulp.parallel(value[0], value[1]));
		} else {
			gulp.task(task_name, value);
		}
		array.push(task_name);
	}

	gulp.task(task, gulp.parallel(array));
}

function extend(origin, add) {
	// Don't do anything if add isn't an object
	if (!add || typeof add !== 'object') {return origin;}

	var keys = Object.keys(add);
	var i = keys.length;
	while (i--) {
		origin[keys[i]] = add[keys[i]];
	}
	return origin;
}
