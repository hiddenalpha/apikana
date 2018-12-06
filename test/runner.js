"use strict";


const Jasmine = require( "jasmine" );

const DEBUG = typeof(process.env.DEBUG) != "undefined";


if( require.main == module ) setImmediate( main );

function main(){
	const stdout = process.stdout;

	exitWhenEnvNotOk();

	if(DEBUG) stdout.write( "[DEBUG] Create jasmine instance\n" );
	const jasmine = new Jasmine();

	const configFilePath = __dirname.replace(/\\/g,'/') + "/jasmine.config.json";
	if(DEBUG) stdout.write( "[DEBUG] Load jasmine config '"+ configFilePath +"'\n" );
	jasmine.loadConfigFile( configFilePath );

	if(DEBUG) stdout.write( "[DEBUG] Execute jasmine tests now\n" );
	jasmine.execute();
}


function exitWhenEnvNotOk(){
	const envPath = process.env.NODE_PATH
		? process.env.NODE_PATH.replace(/\\/g,'/')
		: null;
	const cwd = process.cwd().replace( /\\/g , '/' );

	// Check if our cwd (hopefully our projects root) exists in NODE_PATH.
	if( !envPath || envPath.indexOf(cwd) == -1 ){ printAndExit(); }

	function printAndExit(){
		console.log( "[ERROR] Make sure projects root dir is included in NODE_PATH:" );
		console.log( "[ERROR] " );
		console.log( "[ERROR]     export NODE_PATH=`pwd`" );
		console.log( "[ERROR] " );
		console.log( "[ERROR] Or if you're on windows:" );
		console.log( "[ERROR] " );
		console.log( '[ERROR]     set "NODE_PATH='+process.cwd()+'\\"' );
		console.log( "[ERROR] " );
		process.exit( 1 );
	}
}

