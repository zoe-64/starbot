import { type SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { type ObjectId } from "mongodb";

import type { Client, Collection } from "discord.js";

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface ExtendedClient extends Client {
  commands: Collection<string, Command>;
}

export interface Asset {
  _id?: ObjectId;
  id: string;
  url: string;
  filePath: string;
  tags: string[];
  type: "gif" | "image";
  usageCount: number;
  addedBy: string;
  addedAt: Date;
  likes: string[];
  dislikes: string[];
}

export interface BotCommand {
  _id?: ObjectId;
  name: string;
  tags: string[];
  excludes: string[];
  usageCount: number;
  addedBy: string;
  addedAt: Date;
}

export interface BotCommandSentence {
  _id?: ObjectId;
  id: string;
  command: ObjectId;
  sentence: string;
  targeted: boolean;
  addedBy: string;
  addedAt: Date;
}
