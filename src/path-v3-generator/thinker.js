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

	;(function(){
		console.log( "------------------" );
		function node_toString( node ) {
			//return JSON.stringify( node );
			return node._name;
		}
		function node_getChilds( node ) {
			console.log( "[DEBUG] Extract childs of '"+(node._name|"FOO")+"'" );
			var childs = Object.values( node );
			for( var i=0 ; i<childs.length ; ++i ){
				if( childs[i].name=="_name" ){ childs.splice(i,1); }
			}
			console.log( "[DEBUG] Childs -> ", JSON.stringify(childs) );
			return childs;
		}
		printTree( createPathTreeMock() , node_toString , node_getChilds , stdout );
		console.log( "------------------" );
	}());

	javaTypeFoo.serializeTo( stdout );
}


function printTree( node , toString , getChilds , writable , prefix , stack ) {
	if( !prefix ) prefix = "";
	if( !stack ) stack = [];
	// DEBUG ///////////////////////////////
	if( prefix.length > 150 ) throw Error( "Too deep" );
	// END DEBUG ///////////////////////////
	var previous = stack[stack.length-1];
	writable.write( prefix + " |-> "+ previous||"NULL" );
	var childs = getChilds( node ) || [];
	if( !childs.at ) childs.at = function(i){ return this[i];};
	for( var i=0 ; i<childs.length ; ++i ){
		var child = childs.at( i );
		if( typeof(child) != "object" ) throw Error("asgawrgh");
		writable.write( prefix +" |-> "+ toString(child) +"\n" );
		printTree( child , toString , getChilds , writable , prefix+" |   " );
	}
}


function createPathTreeMock(){
	return enrichNodeName( "sample" , {
		"v1": {
			"antrittscheck": {
				"alarmings": {
					"uuid": {
						"context" : {}
					}
				}
			},
			"alarmings": {
				"className": {
					"alarmings": {},
					"case": {
						"req-._uest": {}
					}
				},
			},
			"users": {
				"my-{class}.zip": {}
			}
		}
	});
	function enrichNodeName( name , node ) {
		node._name = name;
		const keys = Object.keys( node );
		for( var i=0 ; i<keys.length ; ++i ){
			const key = keys[i];
			if( key == "_name" ) break;
			enrichNodeName( key , node[key] );
		}
		return node;
	}
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

