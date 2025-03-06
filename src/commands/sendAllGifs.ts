import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { loadGifCommands } from "../gifCommands";

export const sendAllGifs = {
  command: new SlashCommandBuilder()
    .setName("sendallgifs")
    .setDescription("Sends all GIFs with their indices")
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
        .setDescription("The command to send GIFs from.")
        .setRequired(true)
        .addChoices(...commandChoices);
    }),
  async execute(interaction: CommandInteraction) {
    const gifCommands = loadGifCommands();
    const command = interaction.options.get("commandname", true)
      .value as string;

    const gifUrls = gifCommands.commands[command];

    if (
      !gifUrls ||
      [...gifUrls.both, ...gifUrls.multiple, ...gifUrls.self].length === 0
    ) {
      await interaction.reply("There are no GIFs available for this command.");
      return;
    }

    await interaction.reply(`GIF Index: 0-both\n${gifUrls.both[0]}`);

    for (let i = 1; i < gifUrls.both.length; i++) {
      const gifUrl = gifUrls.both[i];
      await interaction.followUp(`GIF Index: ${i}-both\n${gifUrl}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    for (let i = 0; i < gifUrls.multiple.length; i++) {
      const gifUrl = gifUrls.multiple[i];
      await interaction.followUp(`GIF Index: ${i}-multiple\n${gifUrl}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    for (let i = 0; i < gifUrls.self.length; i++) {
      const gifUrl = gifUrls.self[i];
      await interaction.followUp(`GIF Index: ${i}-self\n${gifUrl}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  },
};
