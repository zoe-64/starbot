import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { filters, transformWords } from "../transform";

export const speak = {
  command: new SlashCommandBuilder()
    .setName("speak")
    .setDescription("Make a message sound like a baby is speaking")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The message to translate")
        .setRequired(true)
    ),
  async execute(interaction: CommandInteraction) {
    const message = interaction.options.get("message", true).value as string;
    const user = interaction.user;
    const nickname = user.displayName || user.username;
    await interaction.reply(
      `${nickname} babbled: ${transformWords(message, filters)}`
    );
    return;
  },
};
