
const Yaml = require("yamljs");
const PathV3Generator = require("src/path-v3-generator/path-v3-generator");
const PathV3Utils = require("src/path-v3-generator/pathV3Utils");


describe( "path-v3-generator" , ()=>{


    it( "Failfast when get invoked with an illegal javaPackage" , ( done )=>{
        const illegalPackages = [
            "space.not allowed", "hyphen-not.allowed", "+", "-", true,
            ""/*empty string*/, "42", "com.9number",
        ];
        for( var i=0 ; i<illegalPackages.length ; ++i ){
            const javaPackage = illegalPackages[ i ];
            try{
                PathV3Generator.createPathV3Generator({ openApi:{} , javaPackage:javaPackage });
                expect( "Throw an Error when using javaPackage=\""+javaPackage+"\"" ).toBe( "behavior" );
            }catch( err ){
                expect( err.message ).toMatch( /javaPackage/i );
            }
        }
        done();
    });


    it( "Every path constant wears a leading slash and no trailing one" , ( done )=>{
        const api = {
            "paths": {
                "/store-inventory": null,
                "/2nd/try": null,
                "/what.about.dots": null,
                "/are/you/sure?": null,
                "/are/you/a-genious": null,
                "/a space": null,
            }
        };

        // Setup & configure a generator instance.
        const victim = PathV3Generator.createPathV3Generator({
            openApi: api,
            javaPackage: "com.example",
        });

        victim.readable()
            .pipe( PathV3Utils.createStringWritable() )
            .then( assertResult )
        ;

        function assertResult( result ){
            const lines = result.split( "\n" );
            var pathCount = 0;
            for( var iLine=0 ; iLine<lines.length ; ++iLine ){
                const line = lines[ iLine ];
                // Extract the generated path.
                const groups = /.*public static final String PATH = BASE_PATH \+ "(.+)";$/.exec( line );
                if( groups == null ){ continue; }
                const value = groups[1];
                expect( value ).toMatch( /^\// ); // MUST HAVE leading slash.
                expect( value ).toMatch( /[^\/]$/ ); // MUST NOT HAVE trailing slash.
                pathCount += 1;
            }
            expect( pathCount ).toBe( 10 );
            done();
        }
    });


    xit( "Generates path classes named by scheme DomainNameApi" , function( done ){
        const victim = PathV3Generator.createPathV3Generator({
            openApi: {
                paths: {}
            },
            javaPackage: "com.example"
        });

        victim.readable()
            .pipe( PathV3Utils.createStringWritable() )
            .then( assertResult )
        ;

        function assertResult( result ){
            const lines = result.split( '\n' );
            var className = null;
            for( var i=0 ; i<lines.length ; ++i ){
                const line = lines[i];
                const m = /^public static class ([A-Za-z0-9_$]+) {$/.exec( line );
                if( m ){
                    expect( className ).toEqual( null );
                    className = m[1];
                }
            }
            expect( className ).toEqual( "To be defined (code_20181207134301)" );
            done();
        }
    });


    xit( "Generates path classes which reside in package 'com.example.lib.my.api.v1.path'" , function( done ){
        const victim = PathV3Generator.createPathV3Generator({
            openApi: {
                paths: {}
            },
            javaPackage: "com.example.lib.my.api.v1"
        });

        victim.readable()
            .pipe( PathV3Utils.createStringWritable() )
            .then( assertResult )
        ;

        function assertResult( result ){
            const lines = result.split( '\n' );
            var firstNonEmptyLine = "";
            for( var i=0 ; firstNonEmptyLine.length < 1 && i<lines.length ; ++i ){
                firstNonEmptyLine = lines[i];
            }
            expect( firstNonEmptyLine ).toEqual( "package com.example.lib.my.api.v1.path;" );
            done();
        }
    });


    xit( "Uses first path segment after v1 after class" , function( done ){
        // Original requirement:
        // | Using dot-notation, a dev can access identifiers which are named like the first path segment after the 'v1' in his declared API.
        // |     Eg: with path "/my/api/v1/foo" a dev could access: MyApi.foo
        const victim = PathV3Generator.createPathV3Generator({
            openApi: {
                paths: {
                    "/my/api/v1/foo": null
                }
            },
            javaPackage: "com.example",
        });

        victim.readable()
            .pipe( PathV3Utils.createStringWritable() )
            .then( assertResult )
        ;

        function assertResult( result ){
            const lines = result.split( '\n' );
            var value;
            for( var i=0 ; i<lines.length ; ++i ){
                const m = /^    public static final String RESOURCE = "([^"]+)";$/.exec( lines[i] );
                if( m ){
                    value = m[1];
                    break; // We assume, first match is the one we're searching for.
                }
            }
            expect( value ).toEqual( "/my/api/v1/foo" );
            done();
        }
    });


    xit( "Provides MyApi.one.two.three when using path '/my/api/v1/one/two/three'" , function( done ){
        // Original requirement:
        // | On such identifiers a dev recursively can access all the path segments through similar identifiers.
        // |     Eg: with path "/my/api/v1/one/two/three" a dev could access: MyApi.one.two.three
        const victim = PathV3Generator.createPathV3Generator({
            openApi: {
                paths: {
                    "/my/api/v1/one/two/three": null,
                }
            },
            javaPackage: "com.example",
        });

        victim.readable()
            .pipe( PathV3Utils.createStringWritable() )
            .then( assertResult )
        ;

        function assertResult( result ){
            expect( "Has-no-asserts" ).toEqual( "Has-good-asserts" );
            done();
        }
    });


    xit( "Provides RESOURCE identifier with leading, but without trailing slash" , function( done ){
        // Original requirement:
        // |   On every such identifier there's a reserved identifier "RESOURCE" available. This identifier is a String containing the full path, without a trailing slash.
        const victim = PathV3Generator.createPathV3Generator({
            openApi: {
                paths: {}
            },
            javaPackage: "com.example",
        });

        victim.readable()
            .pipe( PathV3Utils.createStringWritable() )
            .then( assertResult )
        ;

        function assertResult( result ){
            expect( "No-asserts" ).toBe( "Good-asserts" );
            done();
        }
    });


    xit( "Provides COLLECTION identifier with leading and trailing slash" , function( done ){
        // On every such identifier there's a reserved identifier "COLLECTION" available. This identifier is a String containing the full path, wearing a trailing slash.
        const victim = PathV3Generator.createPathV3Generator({
            openApi: {
                paths: {}
            },
            javaPackage: "com.example",
        });

        victim.readable()
            .pipe( PathV3Utils.createStringWritable() )
            .then( assertResult )
        ;

        function assertResult( result ){
            expect( "No-asserts" ).toBe( "Good-asserts" );
            done();
        }
    });


    xit( "Provides BASED identifier where we can continue with following-up segments" , function( done ){
        //    Also on every segment identifier there's a "BASED" available. After this identifier, a dev can continue to list follow-up path segments same as when "BASE" wouldn't be used.
        const victim = PathV3Generator.createPathV3Generator({
            openApi: {
                paths: {}
            },
            javaPackage: "com.example",
        });

        victim.readable()
            .pipe( PathV3Utils.createStringWritable() )
            .then( assertResult )
        ;

        function assertResult( result ){
            expect( "No-asserts" ).toBe( "Good-asserts" );
            done();
        }
    });


    xit( "The BASED identifier is only available once in a chain" , function( done ){
        //    The "BASED" identifier is only available once in this chain.
        //        Eg: MyApiPaths.foo.BASED.bar.BASED wouldn't be possible.
        const victim = PathV3Generator.createPathV3Generator({
            openApi: {
                paths: {}
            },
            javaPackage: "com.example",
        });

        victim.readable()
            .pipe( PathV3Utils.createStringWritable() )
            .then( assertResult )
        ;

        function assertResult( result ){
            expect( "No-asserts" ).toBe( "Good-asserts" );
            done();
        }
    });


    xit( "Puts only segments after BASED identifier into the constant" , function( done ){
        //    When using RESOURCE/COLLECTION somewhere behind BASED, the string will only contain path segments mentioned after the BASED identifier.
        //        Eg:  Using MyApi.one.BASED.two.three.COLLECTION the path would be "/two/three/".
        const victim = PathV3Generator.createPathV3Generator({
            openApi: {
                paths: {}
            },
            javaPackage: "com.example",
        });

        victim.readable()
            .pipe( PathV3Utils.createStringWritable() )
            .then( assertResult )
        ;

        function assertResult( result ){
            expect( "No-asserts" ).toBe( "Good-asserts" );
            done();
        }
    });


    xit( "Adds a dollar sign to segments which are a variable" , function( done ){
        //    In case a segment is a variable, it will wear a $ (dollar sign) at end of its name.
        //        Eg: Using MyApi.one.two$.three.four$.five would result in "/my/api/v1/one/{two}/three/{four}/five".
        //        There will either only the default or the variable be available. But not both.
        const victim = PathV3Generator.createPathV3Generator({
            openApi: {
                paths: {}
            },
            javaPackage: "com.example",
        });

        victim.readable()
            .pipe( PathV3Utils.createStringWritable() )
            .then( assertResult )
        ;

        function assertResult( result ){
            expect( "No-asserts" ).toBe( "Good-asserts" );
            done();
        }
    });


    xit( "Replaces chars not allowed in java identifiers by an underscore char" , function( done ){
        //    If a segment contains chars not allowed in java identifiers then they will be replaced with _ (underscore).
        const victim = PathV3Generator.createPathV3Generator({
            openApi: {
                paths: {}
            },
            javaPackage: "com.example",
        });

        victim.readable()
            .pipe( PathV3Utils.createStringWritable() )
            .then( assertResult )
        ;

        function assertResult( result ){
            expect( "No-asserts" ).toBe( "Good-asserts" );
            done();
        }
    });


    xit( "Will failfast when substitution of illegal chars would produce a name conflict" , function( done ){
        // In case of a name conflict due to this replacement, Apikana will fail-fast.
        const victim = PathV3Generator.createPathV3Generator({
            openApi: {
                paths: {}
            },
            javaPackage: "com.example",
        });

        victim.readable()
            .pipe( PathV3Utils.createStringWritable() )
            .then( assertResult )
        ;

        function assertResult( result ){
            expect( "No-asserts" ).toBe( "Good-asserts" );
            done();
        }
    });


    xit( "Prepends an additional underscore char to generated identifier when they're a reserved word in java" , function( done ){
        //    If a segment is same as a reserved word in java then it will wear an additional _ (underscore) at the begin (end).
        const victim = PathV3Generator.createPathV3Generator({
            openApi: {
                paths: {}
            },
            javaPackage: "com.example",
        });

        victim.readable()
            .pipe( PathV3Utils.createStringWritable() )
            .then( assertResult )
        ;

        function assertResult( result ){
            expect( "No-asserts" ).toBe( "Good-asserts" );
            done();
        }
    });


});
