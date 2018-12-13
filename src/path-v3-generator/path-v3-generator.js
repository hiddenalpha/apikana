;"use strict";


exports.createPathV3Generator = createPathV3Generator;


// Private ///////////

const Stream = require( "stream" );

const JavaGen = require('../java-gen');
const Log = require('../log');
const StreamUtils = require('../util/stream-utils');

const DEBUG = (process.env.DEBUG !== undefined);
function noop(){}


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
        const fileBeginReadable = StreamUtils.streamFromString( "package "+ options.javaPackage +".path;\n\n" );
        const rootClass = createClass( rootClassName , rootNode );
        return StreamUtils.streamConcat([
            fileBeginReadable,
            rootClass.readable()
        ]);
    }
    function throwIfPathV3GeneratorOptionsBad( options ){
        if( !options.openApi ) throw Error("Arg 'options.openApi' missing.");

        if( !options.openApi.info ) throw Error("Arg 'options.openApi.info' missing.");
        if( !options.openApi.info.title ) throw Error("Arg 'options.openApi.info.title' missing.");

        if( !options.javaPackage ) throw Error("Arg 'options.javaPackage' missing.");
        if( typeof(options.javaPackage) !== "string" ) throw Error( "Arg 'options.javaPackage' string expected but got '"+typeof(options.javaPackage)+"'" );
        if( !/^(?![0-9])(?!.*\.[0-9])[A-Za-z0-9.]+$/.test(options.javaPackage) ) throw Error( "Illegal chars in javaPackage" );

        if( !options.basePath ){
            Log.debug("'options.basePath' not set. Assume empty.");
            options.basePath = "";
        }
    }
}


function createResourceField( options ){
    if( !options ) options = {};
    if( DEBUG ){
        if( !options.path ) throw Error( "Arg 'options.path' missing." );
    }
    const path = options.path;
    options = null;
    return {
        readable: createReadable,
    };
    function createReadable(){
        const resourceField = createJavaVariable({
            access: "public",
            isStatic: true,
            isFinal: true,
            type: "String",
            name: "RESOURCE",
            value: '"'+ path +'"',
        });
        return resourceField.readable();
    }
}


function createCollectionField() {
    return {
        readable: createReadable,
    };
    function createReadable(){
        const collectionField = createJavaVariable({
            access: "public",
            isStatic: true,
            isFinal: true,
            type: "String",
            name: "COLLECTION",
            value: 'RESOURCE + "/"',
        });
        return collectionField.readable();
    }
}


/**
 * @param name {string}
 *      Name of the class to generate.
 * @param node {Map.<string,node>}
 *      The tree node to generate the class for.
 */
function createClass( name , node ){
    if( DEBUG ){
        if( !name ) throw Error("Arg 'name' expected not to be falsy");
    }

    // Extract hidden args.
    const segmentStack = Array.isArray(arguments[2]) ? arguments[2] : [];
    const isBased = !!arguments[3];

    const thisClassName = segmentToConstantName( name );

    // Setup constructor
    const ctorReadable = StreamUtils.streamFromString( "private "+ thisClassName +"(){}\n" );

    // Setup constants. Don't generate them if they're only a single slash.
    const resourceFieldPath = segmentStack.join('/');
    var resourceField;
    var collectionField;
    if( resourceFieldPath === '' ){
        resourceField = collectionField = {
            readable: StreamUtils.streamFromString.bind(0, "" ),
        };
    }else{
        resourceField = createResourceField({
            path: "/"+ resourceFieldPath,
        });
        collectionField = createCollectionField();
    }

    // Setup BASED class in case we're not already based.
    var basedClass;
    if( isBased ){
        basedClass = {
            readable: StreamUtils.emptyStream.bind(0),
        };
    }else{
        const bodyForBased_parts = [];
        Object.keys( node ).forEach(function( segment ){
            const childClass = createClass( segment , node[segment] , [segment] , true ); // Go recursive here.
            bodyForBased_parts.push( childClass );
        });
        const bodyForBased = StreamUtils.streamConcat( bodyForBased_parts.map(e=>e.readable()) );
        basedClass = createJavaCustomType({
            name: "BASED",
            isStatic: true,
            bodyReadable: bodyForBased,
        });
    }

    // Setup child classes.
    const childClasses = [];
    Object.keys( node ).forEach(function( segment ){
        const childClass = createClass( segment , node[segment] , segmentStack.concat([segment]) , isBased ); // Go recursive here.
        childClasses.push( childClass );
    });

    // Compose this class from above parts.
    const thisClass = createJavaCustomType({
        name: thisClassName,
        isStatic: false,
        bodyReadable: StreamUtils.streamConcat([
            ctorReadable,
            resourceField.readable(),
            collectionField.readable(),
            StreamUtils.streamConcat( childClasses.map(e=>e.readable()) ),
            basedClass.readable(),
        ]),
    });
    return thisClass;
}


/**
 * <p>Creates a custom java type (class, interface, ...)</p>
 *
 * @param options.name {string}
 *      Name of the type.
 * @param [options.isStatic=false] {boolean}
 * @param [options.type=class] {string
 *      Either 'class', 'interface' or 'enum'.
 * @param [options.isAbstract=false] {boolean}
 * @param [options.bodyReadable=null] {Readable}
 *      If falsy, body of type will be empty.
 * @return {object}
 *      obj.readable(void) - Returns new readable which will stream that
 *          instance in serialized form.
 */
function createJavaCustomType( options ){
    if( !options ) options = {};
    if( DEBUG ){ // Validate args.
        if( !options.name ){ throw Error( "Arg 'options.name' missing." ); }
        if( typeof(options.bodyReadable)==="undefined" ) throw Error( "Arg 'options.bodyReadable' missing." );
        if( options.type && ["class","interface","enum"].indexOf(options.type) === -1 ) throw Error("Illegal type '"+ options.type +"'.");
    }
    const access = (options.access ? options.access : "public");
    const isStatic = !!options.isStatic;
    const type = options.type || "class";
    const isAbstract = !!options.isAbstract;
    const typeName = options.name;
    const bodyReadable = options.bodyReadable;
    options = null;

    const indent = "    ";
    return {
        readable: createReadable,
    };
    function createReadable(){
        const that = new Stream.Readable({ read:noop });
        // Start of type.
        that.push( access ); // TODO: Prevent space in case 'access' is empty (package private).
        if( isStatic ){ that.push(" static"); }
        if( isAbstract ){ that.push(" abstract"); }
        that.push( " "+ type +" "+ typeName +" {\n" );
        // Inject body from passed in stream.
        if( bodyReadable ){
            bodyReadable
                // Use filter to indent body.
                .pipe( StreamUtils.createLinePrefixStream({ prefix:indent }) )
                .on( "data" , that.push.bind(that) )
                .on( "error" , that.emit.bind(that,"error") )
                .on( "end" , onBodyWritten )
            ;
        }else{
            onBodyWritten();
        }
        function onBodyWritten(){
            // End of type and end of our stream.
            that.push( "}\n" );
            that.push( null );
        }
        return that;
    }
}


/**
 * @param options.type {string}
 *      Type of the wariable.
 * @param options.name {string}
 *      Name for the variable.
 * @param [options.access=""] {""|"public"|"protected"|"private"}
 * @param [options.isStatic=false] {boolean}
 * @param [options.isFinal=false] {boolean}
 * @param [options.value=null] {string}
 *      Value to assign to the variable. If falsy, no assignment is generated.
 */
function createJavaVariable( options ) {
    if( DEBUG ){ // Check args.
        if( options.access && ["","public","protected","private"].indexOf(options.access)===-1 ){ debugger; throw Error( "Illegal access modifier '"+options.access+"'." ); }
        if( !/^[A-Za-z0-9_$][A-Za-z0-9_$]*$/.test(options.type) ) throw Error("Illegal type '"+options.type+"'");
    }
    const access = options.access ? options.access : "";
    const isStatic = !!options.isStatic;
    const isFinal = !!options.isFinal;
    const type = options.type;
    const name = options.name;
    const value = options.value;
    options = null;

    return {
        readable: createReadable
    };
    function createReadable(){
        const that = new Stream.Readable({ read:noop });
        var begun = false;

        if( access.length>0 ){
            that.push( access );
            begun = true;
        }
        if( isStatic ){
            if( begun ){ that.push(" "); }
            that.push( "static" );
            begun = true;
        }
        if( isFinal ){
            if( begun ){ that.push(" "); }
            that.push( "final" );
            begun = true;
        }
        if( begun ){ that.push(" "); }
        that.push( type +" "+ name );
        if( value ){
            that.push( " = "+ value );
        }
        that.push( ";\n" );
        that.push( null );
        return that;
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
 *      Array of array of path-segments to transform into a tree.
 * @return {Map<Map<...>>}
 *      Nested objects where the property names represent a path segment. AKA
 *      tree structure.
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
 *      The value to escape.
 * @return {string}
 *      Passed in value where all special chars are replaced by an underscore
 *      char. Also reserved words will get a leading underscore to prevent name
 *      problems.
 */
function escapeForJavaIdentifier( str ){
    if( DEBUG ){
        if( typeof(str)!=="string" ){ debugger; throw Error("Arg 'str' expected to be string."); }
    }
    // Copied from "https://www.thoughtco.com/reserved-words-in-java-2034200".
    const reservedWords = [
        "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char",
        "class", "const", "continue", "default", "double", "do", "else", "enum",
        "extends", "false", "final", "finally", "float", "for", "goto", "if",
        "implements", "import", "instanceof", "int", "interface", "long", "native",
        "new", "null", "package", "private", "protected", "public", "return",
        "short", "static", "strictfp", "super", "switch", "synchronized", "this",
        "throw", "throws", "transient", "true", "try", "void", "volatile", "while"
    ];
    // Replace every char thats not inside A-Z, a-z, 0-9 underscore or dollar
    // sign. (Yes: There are several more valid chars we shouldn't replace. But
    // its much simpler to quick-n-dirty replace these too)
    str = str.replace( /(^[0-9]|[^A-Za-z0-9_$])/g , '_' );
    if( reservedWords.indexOf(str) !== -1 ){
        str = '_'+ str;
    }
    return str;
}
