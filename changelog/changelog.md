
# Apikana Changelog

This is latest changelog for apikana. Older changelogs are linked at bottom of
this file.


## v0.5.3 - 2019-07-31

- Changed script injection to not match comments.
  ([#43](https://github.com/swisspush/apikana/issues/43)).
- Fix NullPointer when generating error message if path is shorter than
  pathPrefix.
  ([#42](http://github.com/swisspush/apikana/pull/42)).
- Fixed title
- Add refererence to JSON Schema validation keyword


## v0.5.2 - 2019-03-29

- Added missing cli doc for generate1stGenPaths and generate2ndGenPaths
  ([#39](http://github.com/swisspush/apikana/pull/39)).
- Added JavaDoc comments to describe default types (aka built-in types)
  ([#38](http://github.com/swisspush/apikana/pull/38)).


## v0.5.1 - 2019-01-29

- Make 1st and 2nd generation paths deactivatable
  ([#37](http://github.com/swisspush/apikana/pull/37)).
- Also take pathPrefix into account in 3rd gen constants
  ([#36](http://github.com/swisspush/apikana/pull/36)).
- Fixed misleading error message
  ([#35](http://github.com/swisspush/apikana/pull/35)).


## v0.5.0 - 2019-01-07

- Introduce 3rd generation path generator
  ([#32](https://github.com/swisspush/apikana/pull/32)).
- Setup testing environment
  ([#31](http://github.com/swisspush/apikana/pull/31)).
- Move schema generation into a web worker
  ([#28](http://github.com/swisspush/apikana/issues/28),
  [#29](https://github.com/swisspush/apikana/pull/29)).



## Older Releases

Older releases are bundled in their own files. See:

- [v0.4.x](./changelog-v0.4.x.md).
- [v0.3.x](./changelog-v0.3.x.md).
- [v0.2.x](./changelog-v0.2.x.md).
- [v0.1.x](./changelog-v0.1.x.md).

