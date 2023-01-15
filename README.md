# `atomist/github-secret-scanner-skill`

Scan committed code for well-known and custom credentials and secrets across all
your repositories.

:sparkles: [_**View this skill in the Atomist Skills Catalog**_][atomist-skill]
to enable this skill on your repositories. :sparkles:

See the [Atomist website][atomist] for general information about Atomist Skills
and the [Atomist documentation site][atomist-doc] for instructions on how to get
started using Atomist Skills.

[atomist-skill]:
    https://go.atomist.com/catalog/skills/atomist/github-secret-scanner-skill
    "Atomist Skills Catalog - Automate All Your Software Tasks"
[atomist-doc]: https://docs.atomist.com/ "Atomist Documentation"

## Running Locally

`github-secret-scanner-skill` can be executed against a locally cloned
repository or directory using the following command:

```shell
$ docker run -it -v $(pwd):/atm/home atomist/github-secret-scanner-skill scan
```

This will scan the local directory and write a `secrets.json` file with detected
secrets and their location. If secrets are found, the command exits with `1`;
otherwise with `0`.

Use the following command to obtain help for the scan command:

```shell
$ docker run -it atomist/github-secret-scanner-skill scan --help
```

## Contributing

Contributions to this project from community members are encouraged and
appreciated. Please review the [Contributing Guidelines](CONTRIBUTING.md) for
more information. Also see the [Development](#development) section in this
document.

## Code of conduct

This project is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). You are
expected to act in accordance with this code by participating. Please report any
unacceptable behavior to code-of-conduct@atomist.com.

## Connect

Follow [@atomist][atomist-twitter] on Twitter and [The Atomist
Blog][atomist-blog].

[atomist-twitter]: https://twitter.com/atomist "Atomist on Twitter"
[atomist-blog]: https://blog.atomist.com/ "The Atomist Blog"

## Support

General support questions should be discussed in the `#help` channel in the
[Atomist community Slack workspace][slack].

If you find a problem, please create an [issue](../../issues).

## Development

You will need to install [Node.js][node] to build and test this project.

[node]: https://nodejs.org/ "Node.js"

### Build and test

Install dependencies.

```
$ npm ci
```

Use the `build` package script to compile, test, lint, and build the
documentation.

```
$ npm run build
```

### Release

Releases are created by pushing a release [semantic version][semver] tag to the
repository, Atomist Skills take care of the rest.

To make this skill globally available, set its maturity to "stable" via the set
maturity drop-down in its Atomist Community Slack channel.

[semver]: https://semver.org/ "Semantic Version"

---

Created by [Atomist][atomist]. Need Help? [Join our Slack workspace][slack].

[atomist]: https://atomist.com/ "Atomist"
[slack]: https://join.atomist.com/ "Atomist Community Slack"

