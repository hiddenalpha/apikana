"use strict";

const Jasmine = require( "jasmine" );

if( require.main == module ) setImmediate( main );

function main(){
	const stdout = process.stdout;

	stdout.write( "runner - DEBUG - Create jasmine instance\n" );
	const jasmine = new Jasmine();

	const configFilePath = __dirname + "/jasmine.config.json";
	stdout.write( "runner - DEBUG - Load jasmine config '"+ configFilePath +"'\n" );
	jasmine.loadConfigFile( configFilePath );

	stdout.write( "runner - DEBUG - Execute jasmine tests now\n" );
	jasmine.execute();
}

