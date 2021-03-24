## Before you get started

Connect and configure these integrations:

1.  [**GitHub**][github] _(required)_
2.  [**Slack**][slack] or [**Microsoft Teams**][msteams] _(optional)_

[github]: https://go.atomist.com/catalog/integration/github "GitHub Integration"
[slack]: https://go.atomist.com/catalog/integration/slack "Slack Integration"
[msteams]:
    https://go.atomist.com/catalog/integration/microsoft-teams
    "Microsoft Teams Integration"

## How to configure

1.  **Select the files to scan**

    ![File glob](docs/images/file-pattern.png)

    To restrict the files that this skill will run on, provide one or more
    [glob patterns](<https://en.wikipedia.org/wiki/Glob_(programming)>). For
    example, to only run on YAML files with `.yaml` or `.yml` extensions at any
    depth in the repository, you would provide this glob pattern:

        *.{yaml,yml}

1.  **Add additional secret patterns**

    ![Secret pattern](docs/images/secret-pattern.png)

    To scan for other secrets, add regular expressions that match your secret
    format. For example, to match a secret format like
    `KEY-x8w876yu5w2k9f4h3x6a`, which is the string `KEY-` followed by exactly
    twenty alphanumeric characters, this regular expression will do the job:

        KEY-[A-Za-z0-9]{20}

    For help crafting and testing your regular expressions, try
    [this online tool](https://regex101.com/) and see
    [this guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Cheatsheet).

1.  **Disable secret patterns**

    You can disable specific secret patterns. We recommend scanning for as many
    known secrets as possible. Scanning via regular expression can sometimes
    yield false positives, however. Disable a secret pattern to avoid false
    positives for secret types not present in your code base.

    This skill automatically scans for these secrets:

    -   Twitter access token
    -   Facebook access token
    -   Google API key
    -   Google Oauth ID
    -   Picatic API Key
    -   Stripe regular API key
    -   Stripe restricted API key
    -   Square access token
    -   Square Oauth Secret
    -   PayPal Braintree access token
    -   Amazon MWS auth token
    -   Twilio API key
    -   MailGun API key
    -   MailChimp API key
    -   AWS access key ID

    Selecting any number of secrets will disable scanning for those secrets.

1.  **Add secret values to exceptions**

    ![Exceptions](docs/images/exceptions.png)

    Frequently secret values are used in testing and don't represent leaked
    credentials. Use exceptions to enter secret values to ignore during
    reporting. You may also use the exceptions to identify false positives to
    ignore.

1.  **Select chat channel for notifications**

    Specify one or more chat channels that should receive notifications when
    secrets are detected in repositories.

    _Note: The chat message will contain the detected secret value, so you might
    want to post those notifications into a private chat channel._

1.  **Determine repository scope**

    ![Repository filter](docs/images/repo-filter.png)

    By default, this skill will be enabled for all repositories in all
    organizations you have connected.

    To restrict the organizations or specific repositories on which the skill
    will run, you can explicitly choose organizations and repositories.

1.  **Activate the skill**

    Save your configuration and activate the skill by clicking the "Enable
    skill" button.
