;"use strict";


exports.createPathV3Generator = createPathV3Generator;


// Private ///////////

const stream = require( "stream" );

const pathV3Utils = require('./pathV3Utils');
const UrlUtils = require('src/url-utils');


function createPathV3Generator( options ) {
    if( !options ) options = {};
    throwIfPathV3GeneratorOptionsBad( options );
    return {
        "readable": createReadable,
    };
    function createReadable(){
        var isRunning = false;
        const rootNode = transformPathsToTree( options.openApi.paths );
        const rootClassReadable = createClassReadable( "RootClassName" , rootNode );
        return rootClassReadable;
    }
    function throwIfPathV3GeneratorOptionsBad( options ){
        if( !options.openApi ) throw Error("Arg 'options.openApi' missing.");

        if( !options.javaPackage ) throw Error("Arg 'options.javaPackage' missing.");
        if( typeof(options.javaPackage) != "string" ) throw Error( "Arg 'options.javaPackage' string expected but got '"+typeof(options.javaPackage)+"'" );
        if( !/^(?![0-9])(?!.*\.[0-9])[A-Za-z0-9.]+$/.test(options.javaPackage) ) throw Error( "Illegal chars in javaPackage" );
    }
}


function createClassReadable( name , node ){

    const segmentStack = Array.isArray(name) ? name : [name];

    // Setup a readable for every subClass
    const subClasses = [];
    Object.keys( node ).forEach(function( subName ){
        // Go recursive here.
        subClasses.push(createClassReadable( segmentStack.concat(subName) , node[subName] ));
    });

    // Create our own readable which also will consume above prepared streams
    // to embed them as nested classes.
    var isRunning = false;
    const readable = new stream.Readable({ read:function read( n ){
        if( isRunning ){ return; }else{ isRunning=true; }
        readable.push( "public static class "+ name +" {\n" ); // Start of class
        readable.push( "\tprivate "+ name +"(){}\n" ); // Private ctor
        readable.push( "\n" );
        // This classes constants
        readable.push( '\tpublic static final String PATH = BASE_PATH + "/'+ segmentStack.join('/') +'";\n' );
        //
        readable.push( "\n" );
        (function loopNextSubClass( iSubClass ){
            if( iSubClass < subClasses.length ){
                const subClass = subClasses[iSubClass];
                handleSubClass( subClass , loopNextSubClass.bind(0,iSubClass+1) );
            }else{ // EndOfLoop
                onSubClassesPrinted();
            }
        }( 0 ));
        function onSubClassesPrinted(){
            readable.push( "}\n" );
            readable.push( null );
        }
    }});

    function handleSubClass( subClass , doneCback ){
        readable.push( "\t" );
        subClass.on( "data" , function( chunk ){
            // Append intentation
            chunk = chunk.toString().replace( /\n/g , '\n\t' );
            // Then write back as our own data.
            readable.push( chunk );
        });
        subClass.on( "end" , function(){
            // Continue with next sub class when current is done.
            readable.push( "\n" );
            doneCback();
        });
    }

    return readable;
}


/**
 * @param paths {Map<String,any>}
 *		The paths to transform. Actually this methods uses the keys of the
 *		passed map as paths.
 * @return {Map<Map<any>>}
 *		A tree representing the passed in paths.
 */
function transformPathsToTree( paths ){
    const segments2d = splitAllPathsToArrays( paths );
    // Drop leading segment and ensure it was empty.
    for( var i=0 ; i<segments2d.length ; ++i ){
        if( segments2d[i].splice(0,1)[0] != "" ){
            throw Error( "IllegalArgument: Leading slash missing on path '"+segments2d[i].join('/')+"'" );
        }
    }
    const rootNode = arrange2dSegmentsAsTree( segments2d );
    return rootNode;
}


/**
 * <p>Takes an array of paths and splits them all to segments.</p>
 *
 * @param {Array<String>}
 * @return {Array<Array<string>>}
 */
function splitAllPathsToArrays( paths ){
    const keys = Object.keys( paths );
    result = [];
    for( var i=0 ; i<keys.length ; ++i ){
        result[i] = keys[i].split( "/" );
    }
    return result;
}


/**
 * @param paths {Array<Array<string>>}
 *		Array of array of path-segments to transform into a tree.
 * @return {Map<Map<...>>}
 *		Nested objects where the property names represent a path segment.
 */
function arrange2dSegmentsAsTree( paths ){
    return toNode( null , {} , 0 );
    function toNode( name , node , level ){
        for( var i=0 ; i<paths.length ; ++i ){
            const parentName = paths[i][level-1];
            const segment = paths[i][level];
            if( !segment ) continue;
            if( parentName != name ) continue;
            if( !node[segment] ) node[segment] = {};
            toNode( segment , node[segment] , level+1 );
        }
        return node;
    }
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
        segments[i] = segments[i]
            // Replace invalid chars
            .replace( /[^[A-Za-z0-9$_]/g , '_' )
            // Also replace leading numbers
            .replace( /^[0-9]/g , '_' )
        ;
    }
    return segments.join( '_' );
}

function pathSegmentIsVariable( segment ) {
    return /^{.*}$/.test( segment );
}
