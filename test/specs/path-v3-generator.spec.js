
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


	xit( "Every path constant wears a leading slash" , ( done )=>{
	});


	xit( "No path constant wears a trailing slash" , ( done )=>{
		const victim = PathV3Generator.createPathV3Generator({
			openApi: YAML.load( "test/test/src/openapi/api.yaml" ),
			javaPackage: "com.example",
		});
	});


});
