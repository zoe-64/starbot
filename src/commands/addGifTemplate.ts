import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { loadGifCommands, saveGifCommands } from "../gifCommands";
import { loadDynamicCommands } from "../main";

export const addGifTemplate = {
  command: new SlashCommandBuilder()
    .setName("addgiftemplate")
    .setDescription("adds a template to gif commands")
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
        .setDescription("The command to add a template to.")
        .setRequired(true)
        .addChoices(...commandChoices);
    })
    .addStringOption((option) =>
      option
        .setName("template")
        .setDescription("The template to add. Such as %sender% bites %reciver%")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .addChoices(
          { name: "self", value: "self" },
          { name: "multiple", value: "multiple" }
        )
        .setName("type")
        .setDescription("The type of gif to add.")
        .setRequired(true)
    ),

  async execute(interaction: CommandInteraction) {
    const commandName = (interaction as CommandInteraction).options.get(
      "commandname",
      true
    ).value as string;
    const template = (interaction as CommandInteraction).options.get(
      "template",
      true
    ).value as string;
    const type = (interaction as CommandInteraction).options.get("type", true)
      .value as "self" | "multiple";

    const gifCommands = loadGifCommands();
    if (!gifCommands.commands[commandName]) {
      interaction.reply({
        content: "Command name already exists.",
        ephemeral: true,
      });
      return;
    }
    if (!gifCommands.commands[commandName].templates[type]) {
      gifCommands.commands[commandName].templates[type] = [];
    }
    gifCommands.commands[commandName].templates[type].push(template);
    saveGifCommands(gifCommands);
    interaction.reply({
      content: `Command ${commandName} created!`,
      ephemeral: true,
    });
    loadDynamicCommands();
  },
};
