# Slack

## Features

* Open channels and users
* List and open conversations with multiple users
* Open bookmarks of slack channels
* Show unread messages directly in Raycast, mark them as read with just one command

### Usage

Say you want to search for you direct conversations with Max Mustermann in Slack. Just activate this plug-in via command
or alias, press space and type in `Max Mustermann`. This will display all direct messages between you and Max in
all of your workspaces.

If you want to narrow down the results by workspace, e.g. you only want results in workspace 'Foo', then all you need to
do is prepend a prefix of that space name to your search: `-fo Max M`. This will only display the relevant results from
that workspace.

## Installation

Clone this repository and run `npm install && npm run dev`

The app uses two kinds of information - tokens and a cookie.

Usually you have to install a Slack app to obtain an API token. This is quite tedious, as your administrator
has to approve a Slack app only for you - which will hardly ever happen.

But there's a different option - the webinterface also needs to authenticate itself with the Slack backend. And
this is what this plugin also uses.
All data can be obtained when opening Slack in the browser, logging in and opening the dev console.

## Obtaining the parameters

### Token

* Open Slack in your browser, log in
* [Open the dev console](https://developer.chrome.com/docs/devtools/open/), then open the console tab
* Execute the following snippet:

```
# Get the tokens
Object.values(JSON.parse(window.localStorage["localConfig_v2"]).teams).map(team => team.token).join(",")
```

### Cookie

Getting the cookie is a bit more difficult, as `document.cookie` does not return the value we want - for whatever reason.
Instead:
* Open Slack in your browser, log in
* [Open the dev console](https://developer.chrome.com/docs/devtools/open/), then open the network tab
* Open some arbitrary request. When scrolling down to the request headers, there will be a key value pair with the name "Cookie". Copy the value. You are good to go!

