
const Yaml = require("yamljs");
const PathV3Generator = require("src/path-v3-generator/path-v3-generator");
const PathV3Utils = require("src/path-v3-generator/pathV3Utils");


describe( "path-v3-generator" , ()=>{


	it( "TBD-2" , ( done )=>{
		const openApi = Yaml.load("test/src/openapi/api.yaml");
		const victim = PathV3Generator.createPathV3Generator({
			openApi: openApi,
			javaPackage: "com.example",
		});
		const resultCollector = PathV3Utils.createStringWritable();

		victim.writeTo( resultCollector )
			.then(function(){ resultCollector.end(); })
		;

		resultCollector
			.then(function( result ) {
				console.log( "RESULT -> ", result );
				expect("Test").toBe("completely written");
				done();
			})
		;
	});


	function createExampleOpenApi() {
		return {
			"host": "https://base",
			"basePath": "/api",
			"info": {
				"contact": {
					"email": "user@all.users"
				},
				"description": "API for users",
				"title": "User API",
				"version": "VERSION"
			},
			"paths": {
				"/{sample}/v1/antrittscheck/alarmings/{uuid}/context": null,
				"/{sample}/v1/alarmings": null,
				"/{sample}/v1/alarmings/{className}/alarmings": null,
				"/{sample}/v1/alarmings/{className}/case/req-._uest": null,
				"/{sample}/v1/": null,
				"/{sample}/v1/users/my-{class}.zip": null,
				"/{sample}/v1/users/{id}": {
					"get": {
						"operationId": "getUser",
						"parameters": [
							{
								"description": "User ID",
								"in": "path",
								"name": "id",
								"required": true,
								"type": "integer"
							}
						],
						"responses": {
							"200": {
								"description": "ok",
								"schema": {
									"$ref": "#/definitions/User"
								}
							},
							"400": {
								"description": "Invalid request"
							},
							"404": {
								"description": "User not found"
							},
							"500": {
								"description": "Internal error"
							}
						},
						"summary": "Retrieve a user",
						"tags": [
							"user1"
						]
					}
				},
				"/{sample}/v1/users": {
					"get": {
						"description": "bla",
						"operationId": "getUsers",
						"responses": {
							"200": {
								"description": "ok",
								"schema": {
									"$ref": "#/definitions/Users"
								}
							},
							"400": {
								"description": "invalid request"
							},
							"500": {
								"description": "internal error"
							}
						},
						"summary": "Get all users.",
						"tags": [
							"user2"
						]
					},
					"post": {
						"description": "bla",
						"operationId": "postUser",
						"parameters": [
							{
								"description": "the user to be added",
								"in": "body",
								"name": "user",
								"required": true,
								"schema": {
									"$ref": "#/definitions/User"
								}
							}
						],
						"responses": {
							"200": {
								"description": "ok"
							},
							"400": {
								"description": "invalid request"
							},
							"500": {
								"description": "internal error"
							}
						},
						"summary": "Add a new user.",
						"tags": [
							"user3"
						]
					}
				}
			},
			"swagger": 2.0,
			"tags": [
				{
					"description": "user4",
					"name": "user5"
				}
			],
			"definitions": {
				"$ref": [
					"../ts/user.ts"
				]
			}
		};
	}


});
