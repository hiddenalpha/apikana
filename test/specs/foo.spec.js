
const foo = require("src/generate-java-paths");

describe( "my-example-test" , function(){

	xit( "Should have more tests" , function(){
		// Setup request to test.
		var model = {
			"prefix": "myFunnyPrefix",
			"simple": { /* That object I simply copied from a debugging session. */
				"planningAreas": {
					"/end": true,
					"planningAreaNumber": {
						"/param": {
							"type": "string",
							"original": "{planningAreaNumber}",
							"prefix": "",
							"suffix": ""
						},
						"filename": {
							"/param": {
								"type": "string",
								"original": "{filename}",
								"prefix": "",
								"suffix": ""
							},
							"/end": true
						}
					}
				}
			},
		};
		var javaPackage = "com.example";
		var apiName = "aslgawelsgas";
		var host = "host_aeorh";
		var basePath = "werhgewr";

		// Call victim
		const victim = foo( model , javaPackage , apiName , host , basePath );

		;(function(){
			victim.start();
			victim.write();
			victim.finish();
			var file = victim.toFile();
			var path = file.path;
			var contents = file.contents.toString();
			var stringLiterals = contents.split( '"' ).filter((e,i)=>i%2);
		}());

		// TODO: Write asserts.
	});

});
