# `atomist/github-secret-scanner-skill`

<!---atomist-skill-description:start--->

Scan committed code for well-known credentials and secrets

<!---atomist-skill-description:end--->

More information about this skill can be found in the [info][info] document.
Detailed instructions on how to configure the skill on [go.atomist.com][catalog]
are available from the [settings][settings] document.

[info]: INFO.md "Information about this skill"
[settings]: SETTINGS.md "How to configure this skill"
[catalog]: https://go.atomist.com "Atomist Catalog"

## Contributing

Contributions to this project from community members are encouraged and
appreciated. Please review the [Contributing Guidelines](CONTRIBUTING.md) for
more information. Also see the [Development](#development) section in this
document.

## Code of conduct

This project is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). You are
expected to act in accordance with this code by participating. Please report any
unacceptable behavior to code-of-conduct@atomist.com.

## Documentation

Please see [docs.atomist.com][atomist-doc] for developer documentation.

-   List of third-party OSS licenses used in this project: [OSS
    licenses][licenses]

[atomist-doc]: https://docs.atomist.com "Atomist Documentation"
[licenses]: legal/THIRD_PARTY.md "Third-Party Licenses"

## Connect

Follow [@atomist][atomist-twitter] and [blog][atomist-blog] for related updates.

[atomist-twitter]: https://twitter.com/atomist "Atomist on Twitter"
[atomist-blog]: https://blog.atomist.com/ "The Official Atomist Blog"

## Support

General support questions should be discussed in the `#support` channel in the
[Atomist community Slack workspace][slack].

If you find a problem, please create an [issue][].

[issue]: issues "GitHub Issues"

## Development

You will need to install [Node.js][node] to build and test this project.

[node]: https://nodejs.org/ "Node.js"

### Build and test

Install dependencies.

```
$ npm install
```

Use the `build` package script to compile, test, lint, and build the
documentation.

```
$ npm run build
```

### Release

Releases are handled via the [Atomist SDM][atomist-sdm]. Just press the
'Approve' button in the Atomist dashboard or Slack.

[atomist-sdm]:
    https://github.com/atomist/atomist-sdm
    "Atomist Software Delivery Machine"

---

Created by [Atomist][atomist]. Need Help? [Join our Slack workspace][slack].

[atomist]: https://atomist.com/ "Atomist - Automate All the Software Things"
[slack]: https://join.atomist.com/ "Atomist Community Slack"
