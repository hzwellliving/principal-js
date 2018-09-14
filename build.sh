#!/bin/bash
uglifyjs=node_modules/uglify-js/bin/uglifyjs
# build for browser, unuglified version
browserify index.js -t [ babelify --presets [ @babel/preset-env ] ] -o dist/principal.umd.js -d 
# build for browser, uglified version
browserify index.js -t [ babelify --presets [ @babel/preset-env ] ] -d | $uglifyjs -cm -o dist/principal.umd.min.js --source-map "content=inline,filename='principal.umd.min.js',url='principal.umd.min.js.map'"