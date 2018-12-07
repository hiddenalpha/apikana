
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


	xit( "Only uses valid chars for Java identifiers in generated constants" , ( done )=>{
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


});
