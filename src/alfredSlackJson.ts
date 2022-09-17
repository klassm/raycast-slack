import fs from "fs";
import { homedir } from "os";
import process from "process";
import { SlackChannel } from "./SlackChannel";

const filePath = `${ homedir }/.alfred-slack.json`;

export type AlfredSlackJson = AlfredSlackJsonTeam[];

export interface AlfredSlackJsonTeam {
  team: string;
  teamId: string;
  channels: SlackChannel[]
}

export async function provideAlfredSlackJson(): Promise<AlfredSlackJson> {
  if (!fs.existsSync(filePath)) {
    console.log(filePath + " does not exist")
    process.exit(1);
  }

  const buffer = await fs.promises.readFile(filePath);
  const content = buffer.toString("utf-8");
  return JSON.parse(content);
}

export function writeAlfredSlackJson(content: AlfredSlackJson) {
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
}
