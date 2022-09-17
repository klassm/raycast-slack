# Slack

Extension to open Slack channels and contacts without having to obtain an OAuth token.

The plugin uses [Slack Deep Linking](https://api.slack.com/reference/deep-linking#open_a_channel).


### Content of .alfred-slack.json

```
[
  {
    "team": "myTeam",
    "teamId": "ABCDEFG",
    "channels": [
      {
        "name": "#some-channel",
        "id": "ABCDEFGH"
      },
      {
        "name": "@some-user",
        "id": "DEFGHIJK"
      }
    ]
  }
]
```

A `name` only refers to some viewable text. For displaying, only
the IDs are relevant. You can obtain them by opening up the Slack web client
and then switching through channels and users. Note how the URL changed. The static
ID part is the teamId, the variable one is the channel id.

# Updating the content of .alfred-slack.json

As soon you have created an initial `.alfred-slack.json`, updating becomes quite
cumbersome. To ease the process there is a utility script to help you update the content.

This approach will update your `.alfred-slack.json` using all channels and users
in your workspace. Problem about this is that you need an installed Slack app
with `channels.read` and `users.read` permissions. A normal user does not have those permissions.

But in case you do - follow this approach for both updating channels and users.

* You need to get the actual available via the Slack API tester ([users](https://api.slack.com/methods/users.list/test) and [channels](https://api.slack.com/methods/conversations.list/test)). Execute the respective query and copy the content (for each separate) to a top level`list-response.json`.
* In case you don't have a token: you can retrieve it by opening the Slack web ui. In the dev console you can find the token: `Dev Console > Application > Local Storage > localConfig_v2`
* Run `npm run mergeAlfredSlackJsonWithSlackListFromApiTester` to get it merged to your `.alfred-slack.json`.
