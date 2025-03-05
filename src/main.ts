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
import { loadGifCommands, saveGifCommands } from "./gifCommands";

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

const goldenStars: { [userId: string]: number } = {};

const starsCommand = new SlashCommandBuilder()
  .setName("stars")
  .setDescription("Check how many golden stars you have!");

const testSpeakCommand = new SlashCommandBuilder()
  .setName("speak")
  .setDescription("Make a message sound like a baby is speaking")
  .addStringOption((option) =>
    option
      .setName("message")
      .setDescription("The message to translate")
      .setRequired(true)
  );

const addGifCommand = new SlashCommandBuilder()
  .setName("addgifcommand")
  .setDescription("Create a new GIF command.")
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription("The name of the command.")
      .setRequired(true)
  );

const addGif = new SlashCommandBuilder()
  .setName("addgif")
  .setDescription("Add a gif to a command")
  .addStringOption((option) =>
    option
      .setName("commandname")
      .setDescription("The command to add a gif to.")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("gifurl")
      .setDescription("The gif url to add.")
      .setRequired(true)
  );

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
  await registerCommands([
    addGifCommand,
    addGif,
    starsCommand,
    testSpeakCommand,
  ] as SlashCommandBuilder[]); // Register the base commands
  loadDynamicCommands();
});
async function loadDynamicCommands() {
  const gifCommands = loadGifCommands();
  const dynamicCommands = Object.keys(gifCommands.commands).map((commandName) =>
    new SlashCommandBuilder()
      .setName(commandName)
      .setDescription(`Sends a GIF from ${commandName}.`)
  );
  await registerCommands([
    ...dynamicCommands,
    addGifCommand,
    addGif,
    starsCommand,
    testSpeakCommand,
  ] as SlashCommandBuilder[]);
}
client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isCommand()) return;

  // admin commands

  if (
    interaction.user.username === "cute.zoey" ||
    interaction.user.username === "thevoid_fox"
  ) {
    if (interaction.commandName === "addgifcommand") {
      const name = (interaction as CommandInteraction).options.get("name", true)
        .value as string;
      const gifCommands = loadGifCommands();
      if (gifCommands.commands[name]) {
        await interaction.reply({
          content: "Command name already exists.",
          ephemeral: true,
        });
        return;
      }
      gifCommands.commands[name] = [];
      saveGifCommands(gifCommands);
      await loadDynamicCommands();
      await interaction.reply({
        content: `Command ${name} created!`,
        ephemeral: true,
      });
      return;
    }

    if (interaction.commandName === "addgif") {
      const commandName = (interaction as CommandInteraction).options.get(
        "commandname",
        true
      ).value as string;
      const gifUrl = (interaction as CommandInteraction).options.get(
        "gifurl",
        true
      ).value as string;
      const gifCommands = loadGifCommands();
      if (!gifCommands.commands[commandName]) {
        await interaction.reply({
          content: `Command ${commandName} does not exist.`,
          ephemeral: true,
        });
        return;
      }
      gifCommands.commands[commandName].push(gifUrl);
      saveGifCommands(gifCommands);
      await interaction.reply({
        content: `Gif added to ${commandName}!`,
        ephemeral: true,
      });
      return;
    }
  }

  if (interaction.commandName === testSpeakCommand.name) {
    const message = (interaction as CommandInteraction).options.get(
      "message",
      true
    ).value as string;
    const user = interaction.user;
    const nickname = user.displayName || user.username;
    await interaction.reply(
      `${nickname} babbled: ${transformWords(message, filters)}`
    );
    return;
  }

  if (interaction.commandName === starsCommand.name) {
    const stars = goldenStars[interaction.user.id] || 0;
    await interaction.reply(`You have ${stars} golden stars.`);
    return;
  }

  const gifCommands = loadGifCommands();
  if (gifCommands.commands[interaction.commandName]) {
    const gifUrls = gifCommands.commands[interaction.commandName];
    const randomGif = gifUrls[Math.floor(Math.random() * gifUrls.length)];
    await interaction.reply(randomGif);
    return;
  }
});

client.on("messageCreate", async (message: Message) => {
  if (message.author.bot) return; // Ignore messages from bots
});

client.login(token);
