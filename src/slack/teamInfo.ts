import fetch from "node-fetch";
import { Credentials } from "../types/Credentials";
import { TeamInfo } from "../types/TeamInfo";

interface TeamInfoResponse {
  ok: boolean;
  team: {
    id: string;
    name: string;
    icon: {
      image_68: string;
    };
  };
}

function isTeamInfoResponse(value: unknown): value is TeamInfoResponse {
  const response = value as TeamInfoResponse;
  return (
    response.ok !== undefined &&
    response.team !== undefined &&
    response.team.id !== undefined &&
    response.team.name !== undefined &&
    response.team.icon?.image_68 !== undefined
  );
}

export async function teamInfo({ cookie, token }: Credentials): Promise<TeamInfo> {
  const response = await fetch("https://slack.com/api/team.info", {
    method: "GET",
    headers: { Cookie: cookie, Authorization: `Bearer ${token}` },
  });

  const result = await response.json();
  if (!isTeamInfoResponse(result)) {
    console.log("Weird team info response from Slack", result);
    throw new Error("Got a weird team info response from Slack");
  }

  return {
    id: result.team.id,
    name: result.team.name,
    icon: result.team.icon.image_68,
    token: token,
  };
}
