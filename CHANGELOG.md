# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 0.3.0 (2026-03-15)


### ⚠ BREAKING CHANGES

* Remove command toolbar
* fix dimension bar to use maximum col/row count instead of hard-coded
* switch ctxMenuOpen to signal
* fix the directory structure
* cleanup, change modalOpen to plantSelectorOpen
* Refactor dimension bar into new component
* change new component prefix in angular.json
* more rearranging project structure
* restructure app to core/ shared/ features/
* switch modalOpen to a signal
* remove right-click for erase, switch to shift-click
* Use @fontsource fonts to switch to woff2 versions
* move plant map to new file, create empty export service
* a bit of reorg, implement ctrl-click for straight lines
* split into 3 files. Right click now erases
* rename garden-grid.html to garden-planner-html

### Features

* a bit of reorg, implement ctrl-click for straight lines ([32a3028](https://github.com/fergusonjason/garden-planner/commit/32a3028c34672a05336e17290ed185e65742a635))
* Add AI slop version to Angular 21 application shell ([f63b638](https://github.com/fergusonjason/garden-planner/commit/f63b638f580abebb901d22b0970e3dfa873acf45))
* add context menu ([d327849](https://github.com/fergusonjason/garden-planner/commit/d327849cfdf832282a9014c85fdffb1f089b9e5b))
* Add deploy script command to package.json ([89dbd2f](https://github.com/fergusonjason/garden-planner/commit/89dbd2f83a4de69eda1e084ff1dffa3a2b0ae6d9))
* add import/export ([09f3dba](https://github.com/fergusonjason/garden-planner/commit/09f3dbad038603364c2e43cc40468bf4e1398a53))
* Add MIT License to the project ([840e0ab](https://github.com/fergusonjason/garden-planner/commit/840e0ab716bd91cdd19c4f2cf6c24b45fcfa1a7b))
* Add source code link ([e79110e](https://github.com/fergusonjason/garden-planner/commit/e79110e1d129cc109910bc00dba0fd73b535fb1b))
* alphabetize the popup. Remove the extraneous legend at the very bottom. ([cc9c7b5](https://github.com/fergusonjason/garden-planner/commit/cc9c7b57056adc58c7c7e4aad057ebd3391a7601))
* change new component prefix in angular.json ([563eaa7](https://github.com/fergusonjason/garden-planner/commit/563eaa719845bc751367551d63800247ceeb4797))
* change out browser dialog for dialog matching theme ([c6609a2](https://github.com/fergusonjason/garden-planner/commit/c6609a2458118db175f1d2198274c4337a94441a))
* change out the quick reference for actual plants ([efe0bac](https://github.com/fergusonjason/garden-planner/commit/efe0baca6a257de4cd7bb72b5b53dea70499cee2))
* cleanup, add angular-cli-ghpages, fix font imports ([8829c9d](https://github.com/fergusonjason/garden-planner/commit/8829c9db87e114a40ba628ab3ea4c297527a4dca))
* converted planning toolbar over to component ([8640610](https://github.com/fergusonjason/garden-planner/commit/864061024572287f7ddd72a52add6ddb28992d6a))
* Create instructions component and common-styles stylesheet ([6341ae5](https://github.com/fergusonjason/garden-planner/commit/6341ae586fd0827febaaac8b7db721f453a06378))
* Create README ([0d6b11c](https://github.com/fergusonjason/garden-planner/commit/0d6b11cee2dcf8862fc31936fa13cc25b7433a6c))
* Display application version at bottom of application page ([956be60](https://github.com/fergusonjason/garden-planner/commit/956be602b44b07c459efa3c85bde2b8d680089e3))
* extract exportPng and exportPdf to export service ([75807ca](https://github.com/fergusonjason/garden-planner/commit/75807ca3cbbb4207fba2059b0e41e0445b62f1ec))
* first round to convert the selection popup to a separate component ([a5ffde7](https://github.com/fergusonjason/garden-planner/commit/a5ffde76389fe0c968419a0363ccea2eb6094fe3))
* fix the directory structure ([a201d71](https://github.com/fergusonjason/garden-planner/commit/a201d7168377248b78cf135aae748fa0c4a3545a))
* make subtitle a computed because it was giving me the eye twitch ([e0c5893](https://github.com/fergusonjason/garden-planner/commit/e0c5893605a71af782dcc6c323b16cff3cacbd4b))
* more rearranging project structure ([0ea8556](https://github.com/fergusonjason/garden-planner/commit/0ea85561c6e532e5a608b1bac0c8941e76c7f3cc))
* move context menu to separate component ([3e86cec](https://github.com/fergusonjason/garden-planner/commit/3e86cec0fc818242b0b4f708caab83ba0fbe3add))
* move plant map to new file, create empty export service ([65bb413](https://github.com/fergusonjason/garden-planner/commit/65bb413080109b2f0cc5359d0ace65d0fd192e77))
* Move spacing recommendations to popup ([403e742](https://github.com/fergusonjason/garden-planner/commit/403e74283575b3edbcc1c8ba3066f93e8152a69a))
* Refactor dimension bar into new component ([42f516f](https://github.com/fergusonjason/garden-planner/commit/42f516f9bd36e3831ba20d02ee25e3512bb79acc))
* Remove command toolbar ([85098e7](https://github.com/fergusonjason/garden-planner/commit/85098e78a3aee3018e088551ae97476932c1f78f))
* remove right-click for erase, switch to shift-click ([e3f4591](https://github.com/fergusonjason/garden-planner/commit/e3f4591dbdac518b5fdd126f7983cac46e3d8747))
* remove x/y tracking below grid, it's too technical ([5c905ef](https://github.com/fergusonjason/garden-planner/commit/5c905efb4655219653251d6b25c6ff31759965a9))
* restructure app to core/ shared/ features/ ([4f69dba](https://github.com/fergusonjason/garden-planner/commit/4f69dbaf01d224c70cfa28460d52839e93827ab2))
* Set default selected plant to tomato ([3fd0fb1](https://github.com/fergusonjason/garden-planner/commit/3fd0fb15802c39b0bfdc8cc48d6f4d52b51c91c1))
* split into 3 files. Right click now erases ([cd63363](https://github.com/fergusonjason/garden-planner/commit/cd63363d48e135b2221f571d6570318c82ed4f87))
* support horizontal and vertical rows ([094c15f](https://github.com/fergusonjason/garden-planner/commit/094c15fda75ea2ab2cb319e9ee67d6b8bd8aff9c))
* update syntax to allow specifying a starting point ([95cc31b](https://github.com/fergusonjason/garden-planner/commit/95cc31bd1972ed48f95d08fe8020c9e86c654bf8))
* Use [@fontsource](https://github.com/fontsource) fonts to switch to woff2 versions ([7a16bac](https://github.com/fergusonjason/garden-planner/commit/7a16bac81d1279df28e0b9acebdef239c75c074f))
* Use a popup to select drawing color on the grid ([4a0d915](https://github.com/fergusonjason/garden-planner/commit/4a0d915326a005c2bf9ac21a61337ba948147cd4))


### Bug Fixes

* Center sq ft planted display ([ef4a5ef](https://github.com/fergusonjason/garden-planner/commit/ef4a5ef9668060eac02ee1fd6ab70f644daf00b8))
* change "painted" term to "planted" ([7de8480](https://github.com/fergusonjason/garden-planner/commit/7de848072cef1620c25bf0304c22111a7c2c0bc9))
* change the dialog name again ([f2703c9](https://github.com/fergusonjason/garden-planner/commit/f2703c9e7e67f0a47d7406bbe45bbeb8cf6338fc))
* change the dialog name again ([98c0296](https://github.com/fergusonjason/garden-planner/commit/98c0296458ec4b8610ea2cd7ab50d995741c4e9d))
* change version to 0.2.1 in package.json ([d152c07](https://github.com/fergusonjason/garden-planner/commit/d152c078833bddc54f696a86ef8c9c5063878c17))
* Clean up README by removing personal comments ([0917241](https://github.com/fergusonjason/garden-planner/commit/0917241f0e3fb6ba524c0ef6cce8bd0c0dde6413))
* cleanup ([23da36b](https://github.com/fergusonjason/garden-planner/commit/23da36b5bac6168a17e33c14835f4e1ef62148d6))
* cleanup, add a todo ([c606810](https://github.com/fergusonjason/garden-planner/commit/c60681032c1c829173ee53d2beda41e109fd4811))
* cleanup, change modalOpen to plantSelectorOpen ([17d49af](https://github.com/fergusonjason/garden-planner/commit/17d49aff299481c0272dd5caefca980488ff23b5))
* Fix a hanging quotation mark ([bb8b77e](https://github.com/fergusonjason/garden-planner/commit/bb8b77ee418593726f94f3c8a0ea55e002642d3b))
* fix an html element alignment issue ([7716de3](https://github.com/fergusonjason/garden-planner/commit/7716de33e0ea37d437e8661143b8f7cf21b4f813))
* fix dimension bar to use maximum col/row count instead of hard-coded ([3a462ac](https://github.com/fergusonjason/garden-planner/commit/3a462ac05f81f92a48879626091604a2628a5684))
* fix typo in constants folder name ([828d6a8](https://github.com/fergusonjason/garden-planner/commit/828d6a89b15d85c0d396d56855ca736e34791e8a))
* rename garden-grid.html to garden-planner-html ([7a80155](https://github.com/fergusonjason/garden-planner/commit/7a8015535889a9db21ccf32a3efe636b63532993))
* Revise README for clarity on project goals ([78a5081](https://github.com/fergusonjason/garden-planner/commit/78a5081ef2f21ddb7c2b6885d18cbd31a962e198))
* switch ctxMenuOpen to signal ([b744c73](https://github.com/fergusonjason/garden-planner/commit/b744c73bb7afc5fd000ba6b2e272268730fdda2f))
* switch modalOpen to a signal ([6fecdf8](https://github.com/fergusonjason/garden-planner/commit/6fecdf8eb76b1445fbf57d0c58ab8c5ea625ba5e))
* tweak the dimensions bar some more ([4250d51](https://github.com/fergusonjason/garden-planner/commit/4250d512f9a79e7e68e2c43504ffb4e01d2d9414))
* Update README.md ([130b6e1](https://github.com/fergusonjason/garden-planner/commit/130b6e14c04fd3fbefb56b3da861394c88d37b25))
