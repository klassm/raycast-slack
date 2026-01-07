/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Slack Tokens - Slack tokens */
  "tokens": string,
  /** Slack Cookie - Slack Cookie */
  "cookie": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `searchSlack` command */
  export type SearchSlack = ExtensionPreferences & {}
  /** Preferences accessible in the `unreadSlackConversations` command */
  export type UnreadSlackConversations = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `searchSlack` command */
  export type SearchSlack = {}
  /** Arguments passed to the `unreadSlackConversations` command */
  export type UnreadSlackConversations = {}
}

