## What it's useful for

Prevent leaking API keys, access tokens, passwords and other sensitive data by
keeping them out of your codebase. Secret Scanner detects and alerts you when
secrets are committed in your code and configuration in a GitHub repository. It
helps prevent secrets from being exposed by adding a failed GitHub Check when a
secret is detected.

Secret Scanner automatically scans for access and API keys for Twitter,
Facebook, Google, Stripe, Square, PayPal, AWS, Twilio, Mailchimp, Mailgun and
Picatic API. Secret Scanner supports adding patterns to detect other secrets not
detected by default. Add scanning support for other tools with a simple regular
expression.

![Customer quote](docs/images/secret-scanner-customer-quote.png)

-   Flag code and configuration with secrets so that they do not get deployed
-   Supports the most common cloud provider services
-   Add your own secret patterns
-   Manage exceptions to ignore secrets like sample keys
-   Control exactly which secrets to scan for and which files to scan

### Flag code with secrets by adding GitHub Checks

![Check annotations](docs/images/secret-scanner-check-annotations.png)

### Notify committer when secrets are detected

![Slack notifications](docs/images/secret-scanner-slack.png)

### See the full history of all scans in the log

![Log](docs/images/secret-scanner-log.png)

### Add new secret patterns to scan for

![Add new secret patterns](docs/images/secret-scanner-secret-patterns.png)

### Keep track of exceptions so that sample secrets don't block you

![Manage exceptions](docs/images/secret-scanner-exceptions.png)
