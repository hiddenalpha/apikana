"use strict";


exports.createJavaField = createJavaField;
exports.createJavaType = createJavaType;


// Private ////////////////////////////////////////////////////////////////////


function createJavaType( props ){
	// Process args
	if( !props ) props = {};
	//
	const packageName = props.packageName;
	//
	const kind = props.kind;
	if( typeof(kind) != "string" || !JavaTypeKind(kind) ) throw Error("Arg 'props.kind': Expected string but got '"+typeof(kind)+"'");
	//
	const className = props.className;
	if( typeof(className) != "string" ) throw Error("Arg 'props.className': Expected string but got '"+typeof(className)+"'");
	//
	var serializer = props.serializer;
	props = null;
	//
	const fields = createAdvancedArray();
	return Object.create( Object.prototype , {
		/** @return {JavaTypeKind} */
		"getKind": { value: function(){
			return kind;
		}},
		/** Get FullyQualifiedClassName. */
		"getClassName": { value: function(){ return className; }},
		"getPackageName": { value: function(){ return packageName; }},
		"fields": { get: function(){ return fields; }},
		/**
		 * @return {Promise}
		 */
		"serializeTo": { value: function( writable ){
			if( !serializer ){ serializer = createJavaTypeSerializer(); }
			return serializer.serializeTo( this , writable );
		}},
	});
}


function createAdvancedArray( arr , options ){
	if( typeof(arr)=="undefined" ) arr = [];
	if( !Array.isArray(arr) ) throw Error( "Arg 'arr': Array expected but got '"+ typeof(arr) +"'." );
	if( options && options.mixin ){
		Object.defineProperty( arr , 'at' , {value:function(){ return arr[i]; }});
		return arr;
	}else{
		return Object.create( Object.prototype , {
			"constructor": { value: function AdvancedArray(){ throw Error("Not supported."); }},
			"0":           { get:   function(){ throw Error("Index access prohibited. Use 'at()' method instead."); }},
			"at":          { value: function( i ){ return arr[i]; }},
			"length":      { get:   function(){ return arr.length; }},
			"forEach":     { value: function(){ return arr.forEach.apply(     arr,arguments); }},
			"indexOf":     { value: function(){ return arr.indexOf.apply(     arr,arguments); }},
			"join":        { value: function(){ return arr.join.apply(        arr,arguments); }},
			"keys":        { value: function(){ return createAdvancedArray( arr.keys.apply(arr,arguments),{mixin:true}); }},
			"lastIndexOf": { value: function(){ return arr.lastIndexOf.apply( arr,arguments); }},
			"push":        { value: function(){ return arr.push.apply(        arr,arguments); }},
			"shift":       { value: function(){ return arr.shift.apply(       arr,arguments); }},
			"slice":       { value: function(){ return arr.slice.apply(       arr,arguments); }},
			"sort":        { value: function(){ return arr.sort.apply(        arr,arguments); }},
			"splice":      { value: function(){ return createAdvancedArray( arr.splice.apply(arr,arguments)),{mixin:true}; }},
			"values":      { value: function(){ return createAdvancedArray( arr.values.apply(arr,arguments,{mixin:true})); }},
		});
	}
}


function createJavaTypeSerializer( props ){
	if( !props ) props = {};
	const indent = typeof(props.indent)=="string" ? props.indent : "\t";
	return Object.create( Object.prototype , {
		"serializeTo": { value: function( type , writable ){
			const write = createPromisifiedWrite( writable );
			return Promise.resolve()
				.then(function(){
					const packageName = type.getPackageName();
					if( packageName && packageName.length > 0 ){
						return write( "package "+  packageName +";\n\n" );
					}
				})
				.then(write.bind(0, JavaTypeKind.serialized(type.getKind()) +" "+ type.getClassName() +" {\n" ))
				.then(serializeFields.bind(0, type , write , writable ))
				.then(write.bind(0, "}\n" ))
		}}
	});
	function serializeFields( type , write , writable ){
		return new Promise(function( fulfill , reject ){
			(function loop( i ){
				if( i >= type.fields.length ){
					fulfill( null );
				}else{
					Promise.resolve()
						.then(write.bind(0, indent ))
						.then(function(){ return type.fields.at(i).serializeTo(writable); })
						.then(write.bind(0, "\n" ))
						.then( loop.bind(0,i+1) )
					;
				}
			}( 0 ));
		});
	}
}


function createJavaField( props ){
	if( !props ) props = {};
	//
	const accessLevel = AccessLevel( props.accessLevel );
	const isStatic = !!props.isStatic;
	const isFinal = !!props.isFinal;
	//
	const dataType = props.dataType;
	if( !dataType ) throw Error("Arg 'props.dataType' missing.");
	//
	const name = props.name;
	if( typeof(name) != "string" ) throw Error( "Expected arg 'name' to be string but got '"+typeof(name)+"'." );
	//
	var serializer = props.serializer;
	//
	return Object.create( Object.prototype , {
		"getAccessLevel": { value: function(){ return accessLevel; }},
		"isStatic": { value: function(){ return isStatic; }},
		"isFinal": { value: function(){ return isFinal; }},
		"getDataType": { value: function(){ return dataType; }},
		"getName": { value: function(){ return name; }},
		"serializeTo": { value: function( writable ){
			if( !serializer ){ serializer = createJavaFieldSerializer(); }
			return serializer.serialize( this , writable );
		}}
	});
}


/**
 * <p>Factory, creating a serializer, able to serialize {code JavaField}'s.</p>
 */
function createJavaFieldSerializer(){
	return Object.create( Object.prototype , {
		"serialize": { value: function( field , writable ){
			var didWrite = false;
			// Intercept 'write' to track if we already wrote something.
			const write = (function(){
				const nestedWrite = createPromisifiedWrite( writable );
				return function write( chunk ){
					didWrite = true;
					nestedWrite( chunk );
				};
			}());
			return Promise.resolve()
				.then(function serializeAccessLevel(){
					const accessLevelSerialized = AccessLevel.serialized( field.getAccessLevel() );
					if( accessLevelSerialized.length > 0 ){
						mayWriteSpace();
						return write( accessLevelSerialized );
					}
				})
				.then(function serializeStatic(){
					if( field.isStatic() ){
						mayWriteSpace();
						return write("static");
					}
				})
				.then(function serializeFinal(){
					if( field.isFinal() ){
						mayWriteSpace();
						return write("final");
					}
				})
				.then( mayWriteSpace )
				.then(write.bind(0, field.getDataType() +" "+ field.getName() +";" ))
			;
			function mayWriteSpace(){
				if( didWrite ){
					write(' ');
				}
			}
		}}
	});
}


/**
 * <p>Polyfills an enum representing java access.</p>
 */
function AccessLevel( key ){
	switch( key ){
		case "PUBLIC":
		case "PRIVATE":
		case "PROTECTED":
		case "PACKAGE":
			// Its a valid enum constant.
			return key;
		default:
			// Not a valid enum constant.
			throw Error("Unknown AccessLevel '"+key+"'");
	}
}
Object.defineProperties( AccessLevel , {
	/**
	 * @return {string}
	 * 		The enum constant in its serialized representation.
	 */
	"serialized": { value: function( key ){
		key = AccessLevel( key );
		if( key == AccessLevel("PACKAGE") ){
			return "";
		}else{
			return key.toLowerCase();
		}
	}}
});


function JavaTypeKind( key ){
	switch( key ){
		case "CLASS":
		case "INTERFACE":
			return key;
		default:
			// Not a valid enum constant.
			throw Error("Unknown JavaTypeKind '"+key+"'");
	}
}
Object.defineProperties( JavaTypeKind , {
	/**
	 * @return {string}
	 * 		The enum constant in its serialized representation.
	 */
	"serialized": { value: function( key ){
		return JavaTypeKind( key ).toLowerCase();
	}}
});


/**
 * <p>Wraps a nodejs Writable so we only have to pass the chunk. Encoding and
 * callback will be implicitly provided by that wrapper. Also this will wrap
 * the calback API within a Promise API.</p>
 */
function createPromisifiedWrite( writable ){
	if( !writable || typeof(writable.write) != "function" ) throw Error("Arg 'writable': Expected to be writable but isn't.");
	return function( chunk ){
		return new Promise(function( fulfill , reject ){
			if( !writable.write( chunk , "UTF-8" ) ){
				writable.once( "drain" , onWritten );
			}else{
				onWritten();
			}
			function onWritten(){
				if( arguments[0] && Object.keys(arguments[0]).length > 0 ) throw Error("Unexpected behavior _d25fd9f8d2946018060ddcc8f18edb8f_");
				fulfill( null );
			}
		});
	};
}

