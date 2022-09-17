import { config } from "dotenv";
import * as fs from "fs";
import { groupBy } from "lodash";
import { mergeChannels, SlackChannel } from "../SlackChannel";
import { provideAlfredSlackJson, writeAlfredSlackJson } from "../alfredSlackJson";

// Obtain it from https://api.slack.com/methods/users.list/test and from https://api.slack.com/methods/conversations.list/test
// You can retrieve a token by opening the Slack web ui
// Dev Console > Application > Local Storage > localConfig_v2
// Make sure to still be logged in to Slack when you test the API methods - this only works while you
// are still logged in to Slack.
const listResponse = JSON.parse(fs.readFileSync(__dirname + "/../../list-response.json").toString('utf-8'));

config();

const json = provideAlfredSlackJson();

interface ChannelsResponse {
  channels: {
    name: string;
    id: string;
    shared_team_ids: string[]
    is_archived: boolean;
  }[]
}

interface MembersResponse {
  members: {
    real_name: string;
    id: string;
    team_id: string;
    deleted: boolean;
    is_bot: boolean;
  }[]
}

function isChannelsResponse(value: unknown): value is ChannelsResponse {
  return ( value as ChannelsResponse ).channels !== undefined;
}

function isMembersResponse(value: unknown): value is MembersResponse {
  return ( value as MembersResponse ).members !== undefined;
}

function getValuesToMap(response: unknown): SlackChannel[] {
  if (isChannelsResponse(response)) {
    return response.channels
      .filter(channel => !channel.is_archived)
      .map((channel) => ( {
        name: "#" + channel.name,
        id: channel.id,
        teamId: channel.shared_team_ids && channel.shared_team_ids[0]
      } ))
  }

  if (isMembersResponse(response)) {
    return response.members
      .filter((user) => user.real_name)
      .filter(user => !user.deleted && !user.is_bot)
      .map((user) => ( {
        name: "@" + user.real_name,
        id: user.id,
        teamId: user.team_id
      } ))
  }

  throw new Error("Don't know how to handle this response");
}

const groupedByTeams = groupBy(getValuesToMap(listResponse), (result) => result.teamId);

const result = json.map((team) => ( {
  ...team,
  channels: mergeChannels(team.channels, groupedByTeams[team.teamId] || [])
} ))

console.log(JSON.stringify(result));
writeAlfredSlackJson(result);
