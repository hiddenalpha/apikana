"use strict";


exports.createApiPath = createApiPath;


// Private ////////////////////////////////////////////////////////////////////

function createApiPath( props ){
	if( typeof(props.from) != "string" ) throw Error("Arg 'props.from': Expected string but got '"+typeof(props.from)+"'");
	const segments = [];
	//
	props.from.split( '/' ).forEach(function( segmentAsString ){
		const segment = createApiPathSegment({ from:segmentAsString });
		segments.push( segment );
	});
	//
	return Object.create( Object.prototype , {
		"getSegment": { value: function( i ){
			return segments[i];
		}},
		"getSegmentLength": { value: function(){
			return segments.length;
		}},
		"toString": { value: function(){
			var result = "";
			for( var i=0 ; i<this.getSegmentLength() ; ++i ){
				if( i>0 ){ result += "/"; }
				result += this.getSegment( i ).toString();
			}
			return result;
		}}
	});
}


function createApiPathSegment( props ){
	const text = props.from;
	if( typeof(text) != "string" ) throw Error("Arg 'props.from': Expected string but got '"+typeof(text)+"'");
	return Object.create( Object.prototype , {
		"isVariable": { value: function(){ return text[0]=='{' && text.endsWith('}'); }},
		"toString": { value: function(){ return text; }}
	});
}

