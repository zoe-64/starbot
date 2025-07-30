import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  GuildMember,
  Interaction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Collection,
  GatewayIntentBits,
  MessageFlags,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";

import * as path from "path";
import * as dotenv from "dotenv";

import { readdirSync } from "fs";
import { fileURLToPath } from "url";
import { fetchMessageById, sentenceMatcher } from "./utility.js";
import type { Asset, ExtendedClient } from "./types";
import {
  connectToDatabase,
  getAssetCollection,
  getCommandCollection,
  getCommandSentenceCollection,
} from "./db.js";

dotenv.config();
const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID as string;
if (!token || !clientId) {
  throw new Error("Missing required environment variables.");
}
const client: ExtendedClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
}) as ExtendedClient;

client.commands = new Collection();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsPath = path.join(__dirname, "commands");

async function loadCommands(clientId: string) {
  const commandFiles = readdirSync(commandsPath).filter((file) => file.endsWith(".ts"));
  const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];

  const dynamicCommands = await loadDynamicCommands();

  for (const command of dynamicCommands) {
    client.commands.set(command.data.name, command as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    commands.push(command.data.toJSON());
  }

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const commandModule = await import(filePath);
    const command = commandModule.default || commandModule.command;

    if (!command) {
      console.warn(`File ${file} doesn't export a command.`);
      continue;
    }

    // Add to client.commands
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
    console.log(`Loaded command: ${command.data.name}`);
  }
  // Register commands with Discord
  try {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log(`Successfully registered ${commands.length} application commands.`);
  } catch (error) {
    console.error("Error registering commands:", error);
  }
}
const rest = new REST({ version: "10" }).setToken(token);

client.on("interactionCreate", async (interaction: Interaction) => {
  if (interaction.isChatInputCommand()) onCommandInput(interaction as ChatInputCommandInteraction);
  if (interaction.isButton()) onButtonClick(interaction as ButtonInteraction);
});
async function onCommandInput(interaction: ChatInputCommandInteraction) {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "Error executing command.",
      flags: MessageFlags.Ephemeral,
    });
  }
}

async function onButtonClick(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const button = interaction.customId;
  const [type, asset_id] = button.split("_");
  if (type === "like" || type === "dislike") {
    const db = await connectToDatabase(process.env.MONGODB_URI!);
    const collection = await getAssetCollection(db);
    const state = await collection.findOne({ id: asset_id });
    if (!state) {
      console.warn("No matching asset found to update");
      interaction.editReply({
        content: `Failed to ${type} asset ${asset_id}!`,
      });
      return;
    }
    if (type === "like") {
      if (state.likes.includes(interaction.user.id)) {
        await collection.updateOne({ id: asset_id }, { $pull: { likes: interaction.user.id } });
      } else if (state.dislikes.includes(interaction.user.id)) {
        await collection.updateOne(
          { id: asset_id },
          {
            $pull: { dislikes: interaction.user.id },
            $addToSet: { likes: interaction.user.id },
          }
        );
      } else {
        await collection.updateOne({ id: asset_id }, { $addToSet: { likes: interaction.user.id } });
      }
    } else {
      if (state.dislikes.includes(interaction.user.id)) {
        await collection.updateOne({ id: asset_id }, { $pull: { dislikes: interaction.user.id } });
      } else if (state.likes.includes(interaction.user.id)) {
        await collection.updateOne(
          { id: asset_id },
          {
            $pull: { likes: interaction.user.id },
            $addToSet: { dislikes: interaction.user.id },
          }
        );
      } else {
        await collection.updateOne(
          { id: asset_id },
          { $addToSet: { dislikes: interaction.user.id } }
        );
      }
    }
    const asset = await collection.findOne({ id: asset_id });
    if (!asset) return;
    const reply = await fetchMessageById(client, interaction.channelId, interaction.message.id);
    if (!reply) return;
    reply.edit({
      components: [assetActionBar(asset)],
    });
  }

  await interaction.deleteReply();
}
function assetActionBar(asset: Asset) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`dislike_${asset.id}`)
      .setLabel("👎 -1")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("like_counter") // Static ID since this is just a display
      .setLabel(`${asset.likes.length - asset.dislikes.length}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true), // Disable since it's just a counter
    new ButtonBuilder()
      .setCustomId(`like_${asset.id}`)
      .setLabel("👍 +1")
      .setStyle(ButtonStyle.Success)
  );
}

export async function loadDynamicCommands() {
  const db = await connectToDatabase(process.env.MONGODB_URI!);
  const commandsCollection = await getCommandCollection(db);
  const gifCommands = await commandsCollection.find({}).toArray();

  const dynamicCommands = gifCommands.map((command, _) => {
    return {
      data: new SlashCommandBuilder()
        .setName(command.name)
        .setDescription(`Sends a GIF or an Image with the tags ${command.tags.join(", ")}.`)
        .addMentionableOption((option) =>
          option.setName("target").setDescription("Sets the target (optional).").setRequired(false)
        ),
      async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.deferred && !interaction.replied) {
          await interaction.deferReply();
        }
        const targetOption = interaction.options.get("target") as {
          member: GuildMember;
        } | null;
        const targetMember = targetOption?.member;
        const target = targetMember ?? interaction.user;
        const sentenceCollection = await getCommandSentenceCollection(db);
        const [sentence] = await sentenceCollection
          .aggregate([
            {
              $match: {
                command: command._id,
                targeted: Boolean(targetMember),
              },
            },
            {
              $sample: { size: 1 },
            },
          ])
          .toArray();
        try {
          if (!sentence)
            return interaction.followUp({
              content: "No matching sentences found.",
              flags: MessageFlags.Ephemeral,
            });

          const assetCollection = await getAssetCollection(db);
          const [asset] = (await assetCollection
            .aggregate([
              {
                $match: {
                  tags: {
                    $all: command.tags,
                    $nin: [
                      command.excludes.length === 0 ? [] : command.excludes,
                      ...(targetMember ? ["self"] : ["targeted"]),
                    ],
                  },
                },
              },
              {
                $sample: { size: 1 },
              },
            ])
            .toArray()) as Asset[];
          if (!asset) {
            return interaction.followUp({
              content: "No matching assets found.",
              flags: MessageFlags.Ephemeral,
            });
          }

          const file = new AttachmentBuilder(asset.filePath);

          const senderName =
            interaction.user.displayName ||
            interaction.member?.user.username ||
            interaction.user.id;

          const targetName =
            targetMember?.nickname ||
            targetMember?.user.globalName ||
            targetMember?.user.username ||
            target.id;
          const message = sentenceMatcher(sentence.sentence, senderName, targetName, asset.tags);
          await interaction.editReply({
            content: message,
            files: [file],
            components: [assetActionBar(asset)],
          });
        } catch (error) {
          console.error(error);
        }
      },
    };
  });

  return dynamicCommands;
}

loadCommands(clientId)
  .then(() => client.login(token))
  .catch(console.error);
