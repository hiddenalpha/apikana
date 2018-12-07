"use strict";


exports.createPromisifiedWrite = createPromisifiedWrite;
exports.createStringWritable = createStringWritable;


// Impl //////////////

const stream = require("stream");

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


/**
 * @return {Writable|Promise}
 *      A writable stream with a mixed in promise. The promise will resolve
 *      with the written content as string as soon the writable has finished.
 */
function createStringWritable() {
	var fulfill, reject;
	var promise = new Promise(function( f , r ){ fulfill=f; reject=r; });
	var writable = new stream.Writable();
	var chunks = [];
	Object.defineProperties( writable , {
		_write: { value: function( chunk , encoding , done ) {
			chunks.push( chunk.toString() );
			setImmediate( done );
		}},
		// then: { value: promise.then.bind(promise) },
		then: { value: function(){
			return promise.then.apply(promise,arguments);
		}},
		"catch": { value: promise["catch"].bind(promise) },
	});
	writable.on( "finish" , function() {
		setImmediate( fulfill , chunks.join("") );
		chunks = null;
	});
	writable.on( "error" , function( err ) {
		setImmediate( reject , err );
		chunks = null;
	});
	return writable;
}
