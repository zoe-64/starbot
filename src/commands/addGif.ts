import {
  CommandInteraction,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { loadGifCommands, saveGifCommands } from "../gifCommands";

export const addGif = {
  command: new SlashCommandBuilder()
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
    ),
  async execute(interaction: CommandInteraction) {
    const commandName = interaction.options.get("commandname", true)
      .value as string;
    const gifUrl = interaction.options.get("gifurl", true).value as string;
    const gifCommands = loadGifCommands();
    if (!gifCommands.commands[commandName]) {
      interaction.reply({
        content: `Command ${commandName} does not exist.`,
        ephemeral: true,
      });
      return;
    }
    const index = gifCommands.commands[commandName].push(gifUrl) - 1;
    saveGifCommands(gifCommands);
    const channel = interaction.client.channels.cache.get(
      "1347097892996907078"
    ) as TextChannel;
    channel.send(`Gif added to ${commandName} at index ${index}: ${gifUrl}`);
    interaction.reply({
      content: `Gif added to ${commandName} at index ${index}!`,
      ephemeral: true,
    });
  },
};
