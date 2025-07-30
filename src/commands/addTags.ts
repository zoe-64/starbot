import type { ChatInputCommandInteraction } from "discord.js";
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { stringToTags } from "../utility.js";
import { connectToDatabase, getAssetCollection, getCommandCollection } from "../db.js";
export default {
  data: new SlashCommandBuilder()
    .setName("addtag")
    .setDescription("Adds tags")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("asset")
        .setDescription("Add a tag to an asset")
        .addStringOption((option) =>
          option.setName("asset").setDescription("the asset to add the tags to").setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("tags").setDescription("the tags to add").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("command")
        .setDescription("Add a tag to a command")
        .addStringOption((option) =>
          option
            .setName("command")
            .setDescription("the command to add the tags to")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("tags").setDescription("the tags to add").setRequired(true)
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (interaction.options.getSubcommand() === "asset") {
      const asset = interaction.options.getString("asset", true);
      const tags = stringToTags(interaction.options.getString("tags", true));
      const collection = await getAssetCollection(
        await connectToDatabase(process.env.MONGODB_URI!)
      );
      const state = await collection.findOne({ id: asset });
      if (!state) {
        interaction.reply({
          content: "No matching asset found.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      state.tags = state.tags.concat(tags);
      await collection.updateOne({ id: asset }, { $set: { tags: state.tags } });
      interaction.reply({
        content: `Added tags ${tags.join(", ")} to asset ${asset}.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (interaction.options.getSubcommand() === "command") {
      const command = interaction.options.getString("command", true);
      const tags = stringToTags(interaction.options.getString("tags", true));
      const commandsCollection = await getCommandCollection(
        await connectToDatabase(process.env.MONGODB_URI!)
      );
      const [commandDoc] = await commandsCollection.find({ name: command }).toArray();
      if (!commandDoc) {
        interaction.reply({
          content: "No matching command found.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      commandDoc.tags = commandDoc.tags.concat(tags);
      await commandsCollection.updateOne({ name: command }, { $set: { tags: commandDoc.tags } });
      interaction.reply({
        content: `Added tags ${tags.join(", ")} to command ${command}.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
  },
};
