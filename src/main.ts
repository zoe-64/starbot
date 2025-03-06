import {
  Client,
  CommandInteraction,
  GatewayIntentBits,
  Interaction,
  Message,
  REST,
  Routes,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import * as dotenv from "dotenv";
import { filters, transformWords } from "./transform";
import {
  checkAndExecuteGifCommand,
  loadGifCommands,
  saveGifCommands,
} from "./gifCommands";
import { addGifCommand } from "./commands/addGifCommand";
import { addGif } from "./commands/addGif";
import { speak } from "./commands/speak";
import { removeGifCommand } from "./commands/removeGifCommand";
import { removeGif } from "./commands/removeGif";
import { sendAllGifs } from "./commands/sendAllGifs";
import { addGifTemplate } from "./commands/addGifTemplate";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
  throw new Error("No token or client ID found in environment variables.");
}

const commands = [
  addGifCommand,
  addGif,
  speak,
  removeGif,
  removeGifCommand,
  sendAllGifs,
  addGifTemplate,
];

const rest = new REST({ version: "10" }).setToken(token);

const registerCommands = async (commands: SlashCommandBuilder[]) => {
  try {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log("Successfully registered application commands.");
  } catch (error) {
    console.error("Error registering commands:", error);
  }
};

client.once("ready", async () => {
  console.log("Bot is ready!");
  loadDynamicCommands();
});

export async function loadDynamicCommands() {
  const gifCommands = loadGifCommands();
  const dynamicCommands = Object.keys(gifCommands.commands).map((commandName) =>
    new SlashCommandBuilder()
      .setName(commandName)
      .setDescription(`Sends a GIF from ${commandName}.`)
      .addMentionableOption((option) =>
        option
          .setName("target")
          .setDescription("Sets the target")
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName("id")
          .setDescription("The id of the gif format: <index>-<target>.")
          .setRequired(false)
      )
  );
  await registerCommands([
    ...dynamicCommands,
    ...commands.map((data) => data.command),
  ] as SlashCommandBuilder[]);
}
client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isCommand()) return;

  for (const command of commands) {
    if (command.command.name === interaction.commandName) {
      command.execute(interaction);
      return;
    }
  }
  checkAndExecuteGifCommand(interaction);
});

client.on("messageCreate", async (message: Message) => {
  if (message.author.bot) return; // Ignore messages from bots
});

client.login(token);
