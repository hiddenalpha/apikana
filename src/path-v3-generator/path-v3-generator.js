;"use strict";


exports.createPathV3Generator = createPathV3Generator;


// Private ///////////


const pathV3Utils = require('./pathV3Utils');
const UrlUtils = require('src/url-utils');


function createPathV3Generator( options ) {
	if( !options ) options = {};
	if( !options.openApi ) throw Error("Arg 'options.openApi' missing.");
	if( !options.javaPackage ) throw Error("Arg 'options.javaPackage' missing.");
	return {
		writeTo: function( writable ){
			const write = pathV3Utils.createPromisifiedWrite( writable );
			const paths = options.openApi.paths;
			// return Promise.reject( Error("Not impl yet") );
			return Promise.resolve()
				.then(write.bind(0, "package "+ options.javaPackage +";\n\n" ))
				.then(write.bind(0, "public class ToBeDefinedPaths {\n" ))
				.then(function(){return new Promise(function( fulfill ){
					const keys = Object.keys( paths );
					for( var i=0 ; i<keys.length ; ++i ){
						var key = "/"+ UrlUtils.dropSurroundingSlashes(keys[i]);
						const path = paths[key];
						write( '\tpublic static final String '+ pathToConstantName(key) +' = "'+ key +'"\n' );
					}
					fulfill( null );
				})})
				.then(write.bind(0, '}\n' ))
			;
		}
	};
}

function pathToConstantName( path ) {
	var segments = path.replace(/(^\/|\/$)/,"").split( '/' );
	for( var i=0 ; i<segments.length ; ++i ){
		const segment = segments[i];
		if( pathSegmentIsVariable(segment) ){
			// Drop surrounding curly braces.
			segments[i] = segment.substr( 1 , segment.length-2 );
		}else{
			segments[i] = segment.toUpperCase();
		}
	}
	return segments.join( '_' );
}

function pathSegmentIsVariable( segment ) {
	return /^{.*}$/.test( segment );
}
