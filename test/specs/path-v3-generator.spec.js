
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


	it( "Only uses valid chars for Java identifiers in generated constants" , ( done )=>{
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
			console.log( "RESULT:\n" , result , "\n" );
			const lines = result.split( "\n" );
			for( var iLine=0 ; iLine<lines.length ; ++iLine ){
				const line = lines[ iLine ];
				const groups = /.*\s([^\s]+)\s*=\s*"([^\s]+)".*/.exec( line );
				if( groups == null ) continue;
				const constName = groups[1];
				const constValue = groups[2];
				console.log( "-> ", constName, " = ", constValue );
			}
		}
	});


	xit( "Every path constant wears a leading slash" , ( done )=>{
	});


	xit( "No path constant wears a trailing slash" , ( done )=>{
		const victim = PathV3Generator.createPathV3Generator({
			openApi: YAML.load( "test/test/src/openapi/api.yaml" ),
			javaPackage: "com.example",
		});
	});


});
