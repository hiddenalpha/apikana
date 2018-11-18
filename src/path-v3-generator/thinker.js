"use strict";


// No public API.


// Private ////////////////////////////////////////////////////////////////////


const fs = require( "fs" );
const YAML = require( "yamljs" );
const ApiPath = require( "./api-path" );
const JavaType = require( "./java-type" );

const stdout = process.stdout;


if( module == require.main ) setTimeout( main );


function main(){
	loadYaml( fs.createReadStream("test/src/openapi/api.yaml") )
		.then(function( api ){
			const paths = Object.keys( api.paths );
			for( var i=0 ; i<paths.length ; ++i ){
				paths[i] = ApiPath.createApiPath({ from:paths[i] });
			}
			return paths;
		})
		.then(function( paths ){ setupJavaTypes(paths); })
	;
}


function setupJavaTypes( paths ){
	const javaTypeFoo = JavaType.createJavaType({
		packageName: "com.example",
		kind: "CLASS",
		className: "PathsV3",
	});

	for( var iPath=0 ; iPath<paths.length ; ++iPath ){
		const path = paths[iPath];
		const segmentStack = [];
		for( var iSeg=0 ; iSeg<path.getSegmentLength() ; ++iSeg ){
			const s = path.getSegment( iSeg );
			segmentStack.push( s );
			if(segmentStack.length>1) handleConstellation( segmentStack.slice(1) );
		}
	}

	function handleConstellation( path ){
		var name = "";
		path.forEach(function( s , i ){
			if( i==0 && s.length==0 ) return;
			if( i>=1 ){ name += "_"; }
			if( s.isVariable() ){
				var sAsString = s.toString();
				name += sAsString.substr( 1 , sAsString.length-2 );
			}else{
				name += s;
			}
		});
		javaTypeFoo.fields.push(JavaType.createJavaField({
			accessLevel: "PUBLIC",
			isStatic: true,
			isFinal: true,
			dataType: "int",
			name: name,
		}));
	}

	javaTypeFoo.serializeTo( stdout );
}


function createPathTreeMock(){
	return {
		"sample": {
			"v1": {
				"antrittscheck": {
					"alarmings": {
						"uuid": {
							"context" : {}
						}
					}
				},
				"sample": {
					"v1": {
						"alarmings": {
							"className": {
								"alarmings": {}
							}
						}
					}
				},
				"sample": {
					"v1": {
						"alarmings": {
							"className": {
								"case": {
									"req-._uest": {}
								}
							}
						}
					}
				},
				"sample": {
					"v1": {
						"users": {
							"my-{class}.zip": {}
						}
					}
				}
			}
		}
	};
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

