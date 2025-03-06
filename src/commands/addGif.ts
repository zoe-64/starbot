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
    .addStringOption((option) => {
      const gifCommands = loadGifCommands();
      const commandChoices = Object.keys(gifCommands.commands).map(
        (commandName) => ({
          name: commandName,
          value: commandName,
        })
      );

      return option
        .setName("commandname")
        .setDescription("The command to add a gif to.")
        .setRequired(true)
        .addChoices(...commandChoices);
    })
    .addStringOption((option) =>
      option
        .setName("gifurl")
        .setDescription("The gif url to add.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("target")
        .setDescription("The target for the gif: self, multiple, or both.")
        .setRequired(true)
        .addChoices(
          { name: "self", value: "self" },
          { name: "multiple", value: "multiple" },
          { name: "both", value: "both" }
        )
    ),
  async execute(interaction: CommandInteraction) {
    const commandName = interaction.options.get("commandname", true)
      .value as string;
    const gifUrl = interaction.options.get("gifurl", true).value as string;
    const target = interaction.options.get("target", true).value as
      | "self"
      | "multiple"
      | "both";

    const gifCommands = loadGifCommands();
    if (!gifCommands.commands[commandName]) {
      interaction.reply({
        content: `Command ${commandName} does not exist.`,
        ephemeral: true,
      });
      return;
    }

    const index = gifCommands.commands[commandName][target].push(gifUrl) - 1;
    saveGifCommands(gifCommands);

    const channel = interaction.client.channels.cache.get(
      "1347097892996907078"
    ) as TextChannel | undefined;
    if (channel) {
      channel.send(
        `Gif added to ${commandName} at index ${index}-${target}: ${gifUrl} with target ${target}`
      );
    }

    interaction.reply({
      content: `Gif added to ${commandName} at index ${index} with target ${target}!`,
      ephemeral: true,
    });
  },
};
