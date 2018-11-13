"use strict";


// No public API.


// Private ////////////////////////////////////////////////////////////////////


const fs = require( "fs" );
const YAML = require( "yamljs" );
const JavaType = require( "./java-type" );

const stdout = process.stdout;


if( module == require.main ) setTimeout( main );


function main(){
	loadYaml( fs.createReadStream("test/src/openapi/api.yaml") )
		.then(function( api ){
			const modelPaths = api.definitions.$ref;
			console.log( modelPaths );
		})
	;
}


function setupJavaTypes(){
	const javaTypeFoo = JavaType.createJavaType({
		packageName: "com.example",
		kind: "CLASS",
		className: "Foo",
	});

	javaTypeFoo.addField(JavaType.createJavaField({
		accessLevel: "PUBLIC",
		isStatic: true,
		isFinal: true,
		dataType: "int",
		name: "id"
	}));

	javaTypeFoo.addField(JavaType.createJavaField({
		accessLevel: "PUBLIC",
		isStatic: true,
		isFinal: true,
		dataType: "String",
		name: "name",
	}));

	javaTypeFoo.serializeTo( stdout );
}


function loadYaml( readable ){
	return collectReadableToString( readable )
		.then(function( yamlAsString ){
			return YAML.parse( yamlAsString );
		})
	;
}

function collectReadableToString( readable ){
	return new Promise(function( fulfill , reject ){
		var content = "";
		readable
			.on( "data" , function( buffer ){
				content += buffer.toString( "UTF-8" );
			})
			.on( "end" , function(){
				fulfill( content );
			})
		;
	});
}

