# `atomist/github-secret-scanner-skill`

<!---atomist-skill-readme:start--->

This skill detects common secrets and creates GitHub checks to indicating whether a push contained undesired secrets. It also supports adding patterns to detect other secrets not detected by default by this skill.
 
## Configuration

### Which files to scan

To restrict the files that this skill will run on, provide one or more glob patterns. For example, to only run on YAML files with `.yaml` or `.yml` extensions at any depth in the repository, you could provide this glob pattern:

`*.yaml,*.yml`
 
For more information on glob patterns, see [the wikipedia page](https://en.wikipedia.org/wiki/Glob_(programming)).

### Secret patterns

This skill automatically scans for these secrets:

- Twitter access token
- Facebook access token
- Google API key
- Google Oauth ID
- Picatic API Key
- Stripe regular API key
- Stripe restricted API key
- Square access token
- Square Oauth Secret
- PayPal Braintree access token
- Amazon MWS auth token
- Twilio API key
- MailGun API key
- MailChimp API key
- AWS access key ID

To scan for other secrets, add regular expressions that match your secret format. For example, to match a secret format like `KEY-x8w876yu5w2k9f4h3x6a` , which is the string `KEY-` followed by exactly twenty alphanumeric characters, this regular expression will do the job:

`/KEY-[A-Za-z0-9]{20}/`

For help crafting and testing your regular expressions, try [this online tool](https://regex101.com/) and see [this guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Cheatsheet).

### Which repositories

By default, this skill will be enabled for all repositories in all organizations you have connected.
To restrict the organizations or specific repositories on which the skill will run, you can explicitly
choose organization(s) and repositories.
<!---atomist-skill-readme:end--->
---

Created by [Atomist][atomist].
Need Help?  [Join our Slack workspace][slack].

[atomist]: https://atomist.com/ (Atomist - How Teams Deliver Software)
[slack]: https://join.atomist.com/ (Atomist Community Slack) 
 
