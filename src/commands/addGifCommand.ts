import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { loadGifCommands, saveGifCommands } from "../gifCommands";
import { loadDynamicCommands } from "../main";

export const addGifCommand = {
  command: new SlashCommandBuilder()
    .setName("addgifcommand")
    .setDescription("Create a new GIF command.")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("The name of the command.")
        .setRequired(true)
    ),
  async execute(interaction: CommandInteraction) {
    const commandName = (interaction as CommandInteraction).options.get(
      "name",
      true
    ).value as string;
    const gifCommands = loadGifCommands();
    if (gifCommands.commands[commandName]) {
      interaction.reply({
        content: "Command name already exists.",
        ephemeral: true,
      });
      return;
    }
    gifCommands.commands[commandName] = {
      templates: {
        self: [],
        multiple: [],
      },
      self: [],
      multiple: [],
      both: [],
    };
    saveGifCommands(gifCommands);
    interaction.reply({
      content: `Command ${commandName} created!`,
      ephemeral: true,
    });
    loadDynamicCommands();
  },
};
