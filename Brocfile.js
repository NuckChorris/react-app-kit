var log = require('broccoli-stew').log;
var debug = require('broccoli-stew').debug;
var concat = require('broccoli-concat');
var merge = require('broccoli-merge-trees');
var jshint = require('broccoli-jshint');
var bower = require('broccoli-bower');
var env = require('broccoli-env').getEnv();
var babel = require('broccoli-babel-transpiler');
var uglify = require('broccoli-uglify-js');
var modules = require('broccoli-es6modules');
var sass = require('broccoli-sass');
var prefixer = require('broccoli-autoprefixer');
var imagemin = require('broccoli-imagemin');
var appTree, jsTree, cssTree, staticTree;

staticTree = 'public';
appTree = 'app';
cssTree = 'styles';
vendorTree = merge(['vendor'].concat(bower()), { overwrite: true });


// JS
jsTree = jshint(appTree);
jsTree = babel(jsTree, {
	blacklist: ['strict', 'es6.modules'],
	sourceMaps: 'inline'
});
jsTree = merge([jsTree, vendorTree], { overwrite: true });
jsTree = log(jsTree, { output: 'tree' });
jsTree = new modules(jsTree, {
	useStrict: false,
	bundleOptions: {
		entry: 'main.js',
		name: 'app'
	}
});
// Merge the vendor tree in again for non-moduled stuff
jsTree = merge([jsTree, vendorTree], { overwrite: true });
polyfillTree = concat(jsTree, {
	inputFiles: ['promise.js', 'fetch.js'],
	outputFile: '/assets/polyfills.js',
});
libraryTree = concat(jsTree, {
	inputFiles: ['react.js'],
	outputFile: '/assets/libraries.js',
});
appTree = concat(jsTree, {
	inputFiles: [
		// Module shim
		'loader.js',
		// App
		'app.js',
		'entry.js'
	],
	outputFile: '/assets/app.js',
});
jsTree = merge([jsTree, polyfillTree, libraryTree, appTree], {overwrite: true});
if (env === 'production')
	jsTree = uglify(jsTree);


// CSS
cssTree = sass([cssTree, vendorTree], 'app.scss', '/assets/app.css');
cssTree = prefixer(cssTree, {
	browsers: ['> 2%', 'last 3 versions', 'Firefox ESR', 'Opera 12.1']
});


// STATIC
staticTree = imagemin(staticTree, { destDir: '/assets' });


buildTree = merge([jsTree, cssTree, staticTree], { overwrite: true });
module.exports = log(buildTree, { output: 'tree', label: 'BUILD OUTPUT' });
