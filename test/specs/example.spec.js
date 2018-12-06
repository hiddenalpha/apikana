"use strict";


// We can write includes relative to our projects root dir because in
// 'test/runner.js' we enfore propper configuration.

//const MyVictim = require("src/my-feature/my-victim");  // <- Doesn't exist of course.

// Mock above include because that victim module doesn't exist :)
const MyVictim = {
    createFoo: function(){
        return {
            iAmWellTested: function(){ return false; }
        };
    }
};


describe( "my-feature" , function(){


    // TODO: Don't eXclude that test.
    xit( "Has tests" , function( done ){

        const victim = MyVictim.createFoo();

        expect( victim.iAmWellTested() ).toBe( true );

        done();
    });


});
