import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { loadGifCommands } from "../gifCommands";

export const sendAllGifs = {
  command: new SlashCommandBuilder()
    .setName("sendallgifs")
    .setDescription("Sends all GIFs with their indices")
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("The command that the gifs come from")
        .setRequired(false)
    ),
  async execute(interaction: CommandInteraction) {
    const gifCommands = loadGifCommands();
    const command = interaction.options.get("command", true).value as string;

    const gifUrls = gifCommands.commands[command];

    if (!gifUrls || gifUrls.length === 0) {
      await interaction.reply("There are no GIFs available for this command.");
      return;
    }

    await interaction.reply(`GIF Index: 0\n${gifUrls[0]}`);

    for (let i = 1; i < gifUrls.length; i++) {
      const gifUrl = gifUrls[i];
      await interaction.followUp(`GIF Index: ${i}\n${gifUrl}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  },
};
