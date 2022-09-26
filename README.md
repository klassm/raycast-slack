# Slack

Extension to open Slack channels and users. You can also list the bookmarks of a Slack channel.

Installation: Clone this repository and run `npm run dev`

The plugin uses [Slack Deep Linking](https://api.slack.com/reference/deep-linking#open_a_channel).

The app uses two kinds of information - tokens and a cookie.

Usually you have to install a Slack app to obtain an API token. This is quite tedious, as your administrator
has to approve a Slack app only for you - which will hardly ever happen.

But there's a different option - the webinterface also needs to authenticate itself with the Slack backend. And
this is what this plugin also uses.
All data can be obtained when opening Slack in the browser, logging in and opening the dev console.

## Obtaining the parameters

* Open Slack in your browser, log in
* Open the dev console, then open the console tab
* Execute the following snippets:

```
# Get the tokens
Object.values(JSON.parse(window.localStorage["localConfig_v2"]).teams).map(team => team.token).join(",")

# Get the cookie
document.cookie
```

