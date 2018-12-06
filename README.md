<p align='right'>A <a href="http://www.swisspush.org">swisspush</a> project <a href="http://www.swisspush.org" border=0><img align="top"  src='https://1.gravatar.com/avatar/cf7292487846085732baf808def5685a?s=32'></a></p>
<p align="center">
  <img src="https://cloud.githubusercontent.com/assets/692124/21751899/37cc152c-d5cf-11e6-97ac-a5811f48c070.png"/>
</p>
# Apikana
Integrated tools for REST API design.

Apikana combines the following tools to facilitate the authoring of contract-first REST APIs:

* [Swagger](http://swagger.io/swagger-ui/)
* [typescript-json-schema](https://github.com/YousefED/typescript-json-schema)
* [Docson](https://github.com/lbovet/docson)

It basically generates formal schemas and documentation from a mixed swagger/typescript definition that is easy to author and maintain.

It supports also java:

* Use the provided parent-pom and maven-plugin (see [apikana-java](https://github.com/nidi3/apikana-java)).
* Generate java types (thanks to [jsonschema2pojo](http://www.jsonschema2pojo.org/)).

See it in action in [apikana-sample](https://github.com/lbovet/apikana-sample).

## Usage

### Create a new API project

Install apikana `npm install -g apikana`.
Run `apikana init`.

This starts an interactive wizard that lets you define the main aspects of the API project.

### Use as a global tool

When `apikana start src` is executed, it looks in `src/openapi` for a file named `api.yaml`.
This is an [OpenAPI 2.0](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md) file defining the REST API.
In the `definitions` section a `$ref` can be given which references typescript file(s) defining the data models.
`$ref` can be a comma or newline separated string or an array thereof.
The models should be defined as typescript `export interface`s.

At the end, the `dist` directory contains the json schemas and a complete HTML documentation of the API.
Just open a browser at `http://localhost:8333`.

`src/openapi/api.yaml`
```yaml
paths:
  /sample/users:
    get:
      operationId: getUser
      responses:
        200:
          description: ok
          schema:
            $ref: "#/definitions/User"
definitions:
  $ref: ../ts/user.ts
```

`src/ts/user.ts`
```ts
export interface User {
    id: number
    firstName: string // The given name
    lastName: string // the family name @pattern [A-Z][a-z]*
    age?: number
}
```

The `src/style` directory can contain `css` and image files which can be used to style the generated HTML document.


### Use as a devDependency

Instead of being globally installed, apikana can also be defined as a `devDependency` of a project.
A sample configuration would look like:

```json
{
  "name": "My API project",
  "scripts": {
    "start": "apikana start src"
  },
  "devDependencies": {
    "apikana": "0.4.13"
  }
}
```

Then simply run `npm start`.


## Development

Development is done within feature branches in forked repositories. When ready
it gets merged to _swisspush/develop_ via merge request (at best including review).


### Testing

You can run tests using `npm test` within projects root directory.


### Releasing

Releasing is done by updating the version with `npm version patch|minor|major`
and merging _develop_ into _master_. Then [Travis CI](https://travis-ci.org)
will notice the changes on master and perform the release.


### Publishing

To publish to _npmjs.org_, environment variable `NPM_TOKEN` must be set. You
can accomplish this by executing `npm login` locally and afterwards extracting
corresponding value from `~/.nmprc`.

