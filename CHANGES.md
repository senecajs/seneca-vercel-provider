# Changes

## 0.2.0 2026-11-21

First entry of this change log. Earlier versions are on npm and in the git
history.

* Seneca 4: the peer dependency is `seneca` `^4.0.0` (was `>=3`). Seneca 3
  users stay on `@seneca/vercel-provider@0.1`.
* The entity peer is `@seneca/entity` `^29.0.0` instead of `seneca-entity`.
  The other peers are `@seneca/provider` `^5.0.0` and `@seneca/env` `^0.6.0`,
  which is now optional: the plugin itself does not use it.
* The `seneca-promisify` peer dependency is removed. Seneca 4 has promises
  built in; do not call `use('promisify')` (D4).
* Node.js 24 or later (`engines.node` `>=24`, was `>=14`).
* Fix: the plugin no longer imports `node-fetch`, which was only a
  development dependency, so the published 0.1.0 failed to load unless the
  application installed `node-fetch` itself. It uses the global `fetch` of
  Node.js.
* Since 0.1.0 (unreleased until now): the plugin uses the `makeUtils`
  helpers of `@seneca/provider` instead of its own. The provider keys are
  still `usertoken` and `projectname` (the name of new projects).
* The package is built when it is packed (`prepack`), so the published
  package contains `dist`.
* Tests load plugins by full name (`@seneca/entity`, `@seneca/env`,
  `@seneca/provider`). Without credentials the project tests run against a
  local mock of the Vercel API, with a dummy `VERCEL_USERTOKEN`; with
  `test/local-env.js` or the environment variable `VERCEL_USERTOKEN` (and
  `VERCEL_PROJECT_ID` for the load test) they call the Vercel API. The
  project save test runs only against the mock, because live it creates a
  project. Live calls were not tested on Seneca 4.
* devDependencies: `seneca` `^4.0.0`, `@seneca/entity` `^29.0.0`,
  `@seneca/env` `^0.6.0`, `@seneca/provider` `^5.0.0` and `seneca-msg-test`
  `^5.0.0`. Removed `node-fetch`, `@types/node-fetch` and the unused
  `@seneca/doc`.
* README: Seneca 4 install line, plugins loaded by full name, a project
  example.
* `repository.url` uses `git+https`, `publishConfig` sets public access, and
  the package includes `CHANGES.md`.
