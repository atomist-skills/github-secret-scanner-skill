# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased](https://github.com/atomist-skills/github-secret-scanner-skill/compare/2.4.7...HEAD)

## [2.4.7](https://github.com/atomist-skills/github-secret-scanner-skill/compare/2.4.6...2.4.7) - 2021-06-25

### Fixed

*   Fix argument order for attributes-tx. [1fc8089](https://github.com/atomist-skills/github-secret-scanner-skill/commit/1fc80893d02ad1f7b7985cb03788296eee40f904)

## [2.4.6](https://github.com/atomist-skills/github-secret-scanner-skill/compare/2.4.5...2.4.6) - 2021-06-25

### Changed

*   Switch to safe datomic rules. [62f6539](https://github.com/atomist-skills/github-secret-scanner-skill/commit/62f6539bc34c9359e359492ebaff8d9b983b2fa4)

## [2.4.5](https://github.com/atomist-skills/github-secret-scanner-skill/compare/2.4.4...2.4.5) - 2021-04-21

### Changed

*   Update to new logging. [5d90238](https://github.com/atomist-skills/github-secret-scanner-skill/commit/5d902384a40d6ac2f16cc509dddf748bc42646e0)

## [2.4.4](https://github.com/atomist-skills/github-secret-scanner-skill/compare/2.4.3...2.4.4) - 2021-04-19

### Changed

*   Switch to new logging. [dcdfaab](https://github.com/atomist-skills/github-secret-scanner-skill/commit/dcdfaaba10f6b8703b38926a689db6c679b15814)

### Fixed

*   Add branch to cloning. [d18dc45](https://github.com/atomist-skills/github-secret-scanner-skill/commit/d18dc45c4811152335797c3e2b21079af78620ff)

## [2.4.3](https://github.com/atomist-skills/github-secret-scanner-skill/compare/2.4.2...2.4.3) - 2021-04-14

### Changed

*   Increase timeout to 9mins. [76c54f2](https://github.com/atomist-skills/github-secret-scanner-skill/commit/76c54f2679d8ed44255fd85e137b429176681986)

## [2.4.2](https://github.com/atomist-skills/github-secret-scanner-skill/compare/2.4.1...2.4.2) - 2021-04-01

## [2.4.1](https://github.com/atomist-skills/github-secret-scanner-skill/compare/2.4.0...2.4.1) - 2021-03-24

### Added

*   Add support for sending notifications into default channel. [#177](https://github.com/atomist-skills/github-secret-scanner-skill/issues/177)
*   Add support for re-running a check run. [#176](https://github.com/atomist-skills/github-secret-scanner-skill/issues/176)

## [2.4.0](https://github.com/atomist-skills/github-secret-scanner-skill/compare/2.3.0...2.4.0) - 2021-03-16

### Added

*   Add more default secret patterns. [#152](https://github.com/atomist-skills/github-secret-scanner-skill/issues/152)
*   Verify potentional GitHub tokens. [#155](https://github.com/atomist-skills/github-secret-scanner-skill/issues/155)
*   Support .pem private key pattern. [#173](https://github.com/atomist-skills/github-secret-scanner-skill/issues/173)

## [2.3.0](https://github.com/atomist-skills/github-secret-scanner-skill/compare/2.2.0...2.3.0) - 2020-11-17

### Changed

*   Update skill icon. [70c9f26](https://github.com/atomist-skills/github-secret-scanner-skill/commit/70c9f2624f201bbf028a7a4ace733f1a1956acbb)
*   Use type generation in @atomist/skill. [d4b08a0](https://github.com/atomist-skills/github-secret-scanner-skill/commit/d4b08a0f17afdb61016fea734fb778c435c62423)

## [2.2.0](https://github.com/atomist-skills/github-secret-scanner-skill/compare/2.1.9...2.2.0) - 2020-10-16

### Changed

*   Update skill category. [d21ee1b](https://github.com/atomist-skills/github-secret-scanner-skill/commit/d21ee1bbfd4a54038ca98b6e7fdafa5604acae30)

## [2.1.9](https://github.com/atomist-skills/github-secret-scanner-skill/compare/2.1.8...2.1.9) - 2020-10-14

### Changed

*   Remove single dispatch. [54e197a](https://github.com/atomist-skills/github-secret-scanner-skill/commit/54e197a2ddb54722cdef329bd773a737ead89fb6)

## [2.1.8](https://github.com/atomist-skills/github-secret-scanner-skill/compare/2.1.7...2.1.8) - 2020-10-09

### Fixed

*   Add images back. [8855915](https://github.com/atomist-skills/github-secret-scanner-skill/commit/88559152a1b4839e3070931614420d58ee15384d)

## [2.1.7](https://github.com/atomist-skills/github-secret-scanner-skill/compare/2.1.6...2.1.7) - 2020-10-09

### Changed

*   Move to multiple-dispatch style. [#51](https://github.com/atomist-skills/github-secret-scanner-skill/issues/51)

## [2.1.6](https://github.com/atomist-skills/github-secret-scanner-skill/compare/2.1.5...2.1.6) - 2020-07-28

### Changed

*   Update category. [0341be1](https://github.com/atomist-skills/github-secret-scanner-skill/commit/0341be1d9938cb6608b0b97c01735edff77b365d)

## [2.1.5](https://github.com/atomist-skills/github-secret-scanner-skill/compare/2.1.4...2.1.5) - 2020-06-29

### Changed

*   Update description. [01f704e](https://github.com/atomist-skills/github-secret-scanner-skill/commit/01f704e8878a82dbf295ebdfbfcf47ebb3a9c129)

## [2.1.4](https://github.com/atomist-skills/github-secret-scanner-skill/compare/2.1.3...2.1.4) - 2020-06-26

### Added

*   Add different chat providers. [a6f7500](https://github.com/atomist-skills/github-secret-scanner-skill/commit/a6f7500f8dd9fa395dbe6d6ae73480fd65de1324)
*   Ignore SHA integrity hashes from pnpm lock file. [#18](https://github.com/atomist-skills/github-secret-scanner-skill/issues/18)

## [2.1.3](https://github.com/atomist-skills/github-secret-scanner-skill/compare/2.1.2...2.1.3) - 2020-06-23

### Changed

*   Updated to `skill.ts`. [c0427ea](https://github.com/atomist-skills/github-secret-scanner-skill/commit/c0427ea4fadcce712f3030e0223090037afdc65d)

## [2.1.2](https://github.com/atomist-skills/github-secret-scanner-skill/compare/2.1.1...2.1.2) - 2020-06-18

## [2.1.1](https://github.com/atomist-skills/github-secret-scanner-skill/compare/2.1.0...2.1.1) - 2020-06-18

### Added

*   Print out excluded secrets. [7bb4f97](https://github.com/atomist-skills/github-secret-scanner-skill/commit/7bb4f977e51386e626adf2b94c9e89de24d008bb)
*   Add logs link to check-run. [#17](https://github.com/atomist-skills/github-secret-scanner-skill/issues/17)

## [2.1.0](https://github.com/atomist-skills/github-secret-scanner-skill/compare/2.0.1...2.1.0) - 2020-06-05

### Added

*   Add chat message to inform about leaked secrets. [945a33b](https://github.com/atomist-skills/github-secret-scanner-skill/commit/945a33bb23dde7f1ee056e60fafefeb5d99b5bbb)

## [2.0.1](https://github.com/atomist-skills/github-secret-scanner-skill/compare/2.0.0...2.0.1) - 2020-05-01

## [2.0.0](https://github.com/atomist-skills/github-secret-scanner-skill/compare/1.1.2...2.0.0) - 2020-05-01

### Added

*   Add ability to disable certain built-in patterns. [#12](https://github.com/atomist-skills/github-secret-scanner-skill/issues/12)

## [1.1.2](https://github.com/atomist-skills/github-secret-scanner-skill/compare/1.1.1...1.1.2) - 2020-04-11

### Added

*   Link to log detail from checks page. [#11](https://github.com/atomist-skills/github-secret-scanner-skill/issues/11)

## [1.1.1](https://github.com/atomist-skills/github-secret-scanner-skill/tree/1.1.1) - 2020-04-01

### Added

*   Add yarn.lock to ignore list for Twitter access token. [1fea6e8](https://github.com/atomist-skills/github-secret-scanner-skill/commit/1fea6e85c7db134a6999ad6e2f21c1c35950b1ba)
