;"use strict";


exports.createPathV3Generator = createPathV3Generator;


// Private ///////////

const Stream = require( "stream" );

const JavaGen = require('src/java-gen');
const Log = require('src/log');
const PathV3Utils = require('./pathV3Utils');
const UrlUtils = require('src/url-utils');


function createPathV3Generator( options ) {
    if( !options ) options = {};
    throwIfPathV3GeneratorOptionsBad( options );
    return {
        "readable": createReadable,
    };
    function createReadable(){
        // Evaluation of apiName simply copy-pasted from 2ndGen path generator.
        const rootClassName = JavaGen.classOf((options.openApi.info || {}).title || '');
        const rootNode = transformPathsToTree( options.openApi.paths );
        const fileBeginReadable = PathV3Utils.streamFromString( "package "+ options.javaPackage +".path;\n\n" );
        const rootClassReadable = createClassReadable( rootClassName , rootNode );
        return PathV3Utils.streamConcat([ fileBeginReadable , rootClassReadable ]);
    }
    function throwIfPathV3GeneratorOptionsBad( options ){
        if( !options.openApi ) throw Error("Arg 'options.openApi' missing.");

        if( !options.javaPackage ) throw Error("Arg 'options.javaPackage' missing.");
        if( typeof(options.javaPackage) != "string" ) throw Error( "Arg 'options.javaPackage' string expected but got '"+typeof(options.javaPackage)+"'" );
        if( !/^(?![0-9])(?!.*\.[0-9])[A-Za-z0-9.]+$/.test(options.javaPackage) ) throw Error( "Illegal chars in javaPackage" );

        if( !options.basePath ){
            Log.debug("'options.basePath' not set. Assume empty.");
            options.basePath = "";
        }
    }
}


function createClassReadable( name , node , segmentStack ){

    segmentStack = Array.isArray(segmentStack) ? segmentStack : [name];

    // Setup a readable for every subClass
    const subClasses = [];
    Object.keys( node ).forEach(function( subName ){
        // Go recursive here.
        subClasses.push(createClassReadable( subName , node[subName] , segmentStack.concat([subName]) ));
    });

    // Create our own readable which also will consume above prepared streams
    // to embed them as nested classes.
    var isRunning = false;
    const readable = new Stream.Readable({ read:function read( n ){
        if( isRunning ){ return; }else{ isRunning=true; }
        const className = segmentToConstantName( name );
        readable.push( "public static class "+ className +" {\n" ); // Start of class
        readable.push( "\tprivate "+ className +"(){}\n" ); // Private ctor
        readable.push( "\n" );
        // RESOURCE and COLLECTION constants of this class.
        readable.push( '\tpublic static final String RESOURCE = "/'+ segmentStack.join('/') +'";\n' );
        readable.push( '\tpublic static final String COLLECTION = RESOURCE + "/";\n' );
        // BASED of this class
        readable.push( "\n" );
        readable.push( "\tpublic static class BASED {\n" );
        readable.push( "\t\t// TODO: Define that crap.\n" );
        readable.push( "\t}\n" );
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
        subClass
            .pipe(PathV3Utils.createLinePrefixStream({ prefix:"\t" }))
            .on( "data" , readable.push.bind(readable) )
            .on( "end" ,  doneCback )
            .on( "error" , readable.emit.bind(readable,"error") )
        ;
    }

    return readable;
}


/**
 * <p>Creates a 'BASED' class.</p>
 */
function createBasedClass(){
    const that = new Stream.Readable({ read:read });
    var isRunning = false;
    return that;
    function read( n ){
        if( isRunning ){ return; }else{ isRunning=true; }
        that.push( "\tpublic static class BASED {\n" );
        that.push( "\t\t// TODO: Define that crap.\n" );
        that.push( "\t}\n" );
        that.push( null );
    }
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
    const result = [];
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


/**
 * @param segment {string}
 *      Path segment.
 * @return {string}
 *      Java identifier for specified path segment.
 */
function segmentToConstantName( segment ) {
    var ans;
    if( pathSegmentIsVariable(segment) ){
        // Drop surrounding curly braces.
        ans = segment.substr( 1 , segment.length-2 );
        // Add a dollar sign
        ans += '$';
    }else{
        // Use segment as is.
        ans = segment;
    }
    ans = escapeForJavaIdentifier( ans );
    return ans;
}


function pathSegmentIsVariable( segment ) {
    return /^{.*}$/.test( segment );
}


/**
 * @param str {string}
 * @return {string}
 *      Passed in value where all special chars are replaced by an underscore
 *      char.
 */
function escapeForJavaIdentifier( str ){
    if( typeof(str)!=="string" ){ debugger; throw Error("Arg 'str' expected to be string."); }
    // Replace every char thats not inside A-Z, a-z, 0-9 underscore or dollar
    // sign. (Yes: There are several more valid chars we shouldn't replace. But
    // its much simpler to quick-n-dirty replace these too)
    str = str.replace( /[^A-Za-z0-9_$]/g , '_' );
    return str;
}
