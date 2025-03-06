import {
  CommandInteraction,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { loadGifCommands, saveGifCommands } from "../gifCommands";
import { loadDynamicCommands } from "../main";

export const removeGifCommand = {
  command: new SlashCommandBuilder()
    .setName("removegifcommand")
    .setDescription("Remove a gif command by name.")
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
        .setDescription("The command to remove.")
        .setRequired(true)
        .addChoices(...commandChoices);
    }),

  async execute(interaction: CommandInteraction) {
    const commandName = (interaction as CommandInteraction).options.get(
      "commandname",
      true
    ).value as string;
    const gifCommands = loadGifCommands();
    if (!gifCommands.commands[commandName]) {
      interaction.reply({
        content: "Command name does not exist.",
      });
      return;
    }

    await interaction.reply({
      content: `Are you sure you want to remove the gif command "${commandName}"? (y/n)`,
      ephemeral: true,
    });
    const messages = await (interaction.channel as TextChannel).awaitMessages({
      filter: (m) => m.author.id === interaction.user.id,
      max: 1,
      time: 30_000,
    });
    if (!messages || messages.first()?.content.toLowerCase() !== "y") {
      interaction.editReply({
        content: "Removal of gif command cancelled.",
      });
      return;
    }

    delete gifCommands.commands[commandName];
    saveGifCommands(gifCommands);
    interaction.editReply({
      content: `Removed gif command "${commandName}".`,
    });
    loadDynamicCommands();
  },
};
