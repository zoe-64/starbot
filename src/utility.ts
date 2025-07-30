import { unlink, writeFile } from "fs/promises";
import { request } from "undici";
import type { Client, SlashCommandSubcommandBuilder, User } from "discord.js";
import { SlashCommandSubcommandGroupBuilder, SlashCommandBuilder } from "discord.js";
import { client } from "./bot.js";

export async function downloadImage(url: string, path: string) {
  const { body } = await request(url);
  const arrayBuffer = await body.arrayBuffer();
  await writeFile(path, Buffer.from(arrayBuffer));
}
export async function deleteImage(path: string) {
  await unlink(path);
}
export function stringToTags(str: string) {
  return str
    .toLowerCase()
    .split(",")
    .map((t) => t.trim());
}
export function getExcludeTags(tags: string[]) {
  const excludes = tags.reduce((acc, tag) => {
    if (tag.startsWith("-")) {
      acc.push(tag.substring(1));
    }
    return acc;
  }, [] as string[]);
  tags = tags.filter((tag) => !excludes.includes(tag));
  return [tags, excludes];
}

export async function fetchMessageById(client: Client, channelId: string, messageId: string) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      throw new Error("Invalid channel or not a text channel");
    }

    const message = await channel.messages.fetch(messageId);
    return message;
  } catch (error) {
    console.error("Error fetching message:", error);
    return null;
  }
}

type CommandBuilder =
  | SlashCommandBuilder
  | SlashCommandSubcommandGroupBuilder
  | SlashCommandSubcommandBuilder;

export function buildNestedCommand(path: string, description?: string): SlashCommandBuilder {
  const parts = path.split(" ");
  const root = new SlashCommandBuilder()
    .setName(parts[0])
    .setDescription(description || `${parts[0]} command`);

  let current: CommandBuilder = root;

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];

    if (i === parts.length - 1) {
      // Last part is always a subcommand
      (current as SlashCommandSubcommandGroupBuilder).addSubcommand((sub) =>
        sub.setName(part).setDescription(`Manage ${part}`)
      );
    } else {
      // Intermediate parts are subcommand groups
      const group = new SlashCommandSubcommandGroupBuilder()
        .setName(part)
        .setDescription(`Manage ${part}`);

      (current as SlashCommandBuilder).addSubcommandGroup(group);
      current = group;
    }
  }

  return root;
}
export function getRandomOption(options: string[]) {
  return options[Math.floor(Math.random() * options.length)];
}
export function sentenceMatcher(sentence: string, sender: string, target: string, tags: string[]) {
  const matches: Record<string, string | ((tags: string[]) => string)> = {
    "%sender%": sender,
    "%target%": target,
    "%diaper_verb%": (tags: string[]) => {
      if (tags.includes("messy_diaper")) return getRandomOption(["mushy", "stinky", "smelly"]);
      if (tags.includes("wet_diaper")) return getRandomOption(["wet", "sloshy", "soggy"]);
      if (tags.includes("clean_diaper")) return getRandomOption(["clean", "dry", "fresh"]);
      return "";
    },
  };
  for (const [key, value] of Object.entries(matches)) {
    let valueString = "";
    if (typeof value === "function") {
      valueString = value(tags);
    }
    if (typeof value === "string") {
      valueString = value;
    }
    sentence = sentence.replaceAll(key, valueString);
  }
  return sentence.replaceAll("  ", " ");
}

export function getUserFromId(id: string) {
  return client.users.cache.get(id);
}

export function formatUser(user: User | string) {
  if (typeof user === "string") return user;
  return `${user.displayName} (${user.id})`;
}
export function usersToString(users: (User | undefined | string)[]) {
  return users.map((user) => {
    if (!user) return "unknown user";
    if (typeof user === "string") return `user ${user}`;
    return `${user.displayName} (${user.id})`;
  });
}
