import type { ChatInputCommandInteraction, TextChannel } from "discord.js";
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { BotCommandSentence } from "../types.js";
import { connectToDatabase, getCommandCollection, getCommandSentenceCollection } from "../db.js";
export default {
  data: new SlashCommandBuilder()
    .setName("addassetcommandsentence")
    .setDescription("Add a command sentence that comes with the asset")
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("the command to add the sentence to")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("sentence").setDescription("%sender% = you, %target% = them").setRequired(true)
    )
    .addBooleanOption((option) =>
      option.setName("targeted").setDescription("if a target is included").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const command = interaction.options.getString("command", true).toLowerCase();
    const sentence = interaction.options.getString("sentence", true);
    const targeted = interaction.options.getBoolean("targeted", false) || false;

    const commandsCollection = await getCommandCollection(
      await connectToDatabase(process.env.MONGODB_URI!)
    );
    const [commandDoc] = await commandsCollection.find({ name: command }).toArray();
    if (!commandDoc) {
      interaction.reply({
        content: `No command found with name ${command}`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const botSentence: BotCommandSentence = {
      command: commandDoc._id,
      sentence: sentence,
      targeted: targeted,
      addedAt: new Date(),
      addedBy: interaction.user.id,
    };
    const collection = await getCommandSentenceCollection(
      await connectToDatabase(process.env.MONGODB_URI!)
    );
    await collection.insertOne(botSentence);

    const channel = interaction.client.channels.cache.get("1347097892996907078") as
      | TextChannel
      | undefined;
    if (channel) {
      channel.send(`command sentence: ${sentence} added to command ${command}`);
    }

    interaction.reply({
      content: `command sentence: ${sentence} added to command ${command}!`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
