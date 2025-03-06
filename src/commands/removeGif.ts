import {
  CommandInteraction,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { loadGifCommands, saveGifCommands } from "../gifCommands";

export const removeGif = {
  command: new SlashCommandBuilder()
    .setName("removegif")
    .setDescription("Remove a gif from a gif command by index.")
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
        .setDescription("The command to remove a gif from.")
        .setRequired(true)
        .addChoices(...commandChoices);
    })
    .addStringOption((option) =>
      option
        .setName("index")
        .setDescription(
          "The index of the gif to remove. Format: <index>-<target>"
        )
        .setRequired(true)
    ),

  async execute(interaction: CommandInteraction) {
    const commandName = (interaction as CommandInteraction).options.get(
      "commandname",
      true
    ).value as string;
    const index = (interaction as CommandInteraction).options.get("index", true)
      .value as string;
    const gifCommands = loadGifCommands();
    if (!gifCommands.commands[commandName]) {
      interaction.reply({
        content: "Command name does not exist.",
        ephemeral: true,
      });
      return;
    }

    const [indexString, target] = index.split("-");
    const indexNumber = Number(indexString);
    if (target !== "self" && target !== "multiple" && target !== "both") {
      interaction.reply({
        content: "Invalid target.",
        ephemeral: true,
      });
      return;
    }
    const gifUrls: string[] = gifCommands.commands[commandName][target];
    if (indexNumber < 0 || indexNumber >= gifUrls.length) {
      interaction.reply({
        content: "Index out of bounds.",
        ephemeral: true,
      });
      return;
    }

    const gifUrl = gifUrls[indexNumber];
    await interaction.reply({
      content: `Are you sure you want to remove the gif "${gifUrl}" from command "${commandName}"? (y/n)`,
      ephemeral: true,
    });
    const messages = await (interaction.channel as TextChannel).awaitMessages({
      filter: (m) => m.author.id === interaction.user.id,
      max: 1,
      time: 30_000,
    });
    if (!messages || messages.first()?.content.toLowerCase() !== "y") {
      interaction.editReply({
        content: "Removal of gif from command cancelled.",
      });
      return;
    }

    gifUrls.splice(indexNumber, 1);
    saveGifCommands(gifCommands);
    interaction.editReply({
      content: `Removed gif "${gifUrl}" from command "${commandName}".`,
    });
  },
};
