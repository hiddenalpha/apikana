"use strict";


module.exports = Object.create( Object.prototype , {
    dropLeadingSlashes: { value: dropLeadingSlashes }
});


function dropLeadingSlashes( str ){
    if( typeof(str) !== "string" ) throw TypeError( "Arg 'str' of unexpected type. Expected 'string' but got '"+typeof(str)+"'." );
    var start;
    for( start=0 ; str[start]==='/' ; ++start );
    str = str.substr( start );
    return str;
}
