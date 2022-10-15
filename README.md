# Slack

## Features

* Open channels and users
* List and open conversations with multiple users
* Open bookmarks of slack channels
* Show unread messages directly in Raycast, mark them as read with just one command

## Installation

Clone this repository and run `npm install && npm run dev`

The app uses two kinds of information - tokens and a cookie.

Usually you have to install a Slack app to obtain an API token. This is quite tedious, as your administrator
has to approve a Slack app only for you - which will hardly ever happen.

But there's a different option - the webinterface also needs to authenticate itself with the Slack backend. And
this is what this plugin also uses.
All data can be obtained when opening Slack in the browser, logging in and opening the dev console.

## Obtaining the parameters

* Open Slack in your browser, log in
* [Open the dev console](https://developer.chrome.com/docs/devtools/open/), then open the console tab
* Execute the following snippets:

```
# Get the tokens
Object.values(JSON.parse(window.localStorage["localConfig_v2"]).teams).map(team => team.token).join(",")

# Get the cookie
document.cookie
```

Copy the two values (without the quotes surrounding the output) and enter them to the respective fields in the Raycast extension options.

