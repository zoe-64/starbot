import type { ChatInputCommandInteraction } from "discord.js";
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { stringToTags } from "../utility.js";
import { connectToDatabase, getAssetCollection, getCommandCollection } from "../db.js";
export default {
  data: new SlashCommandBuilder()
    .setName("removetag")
    .setDescription("Removes tags")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("asset")
        .setDescription("Remove a tag from an asset")
        .addStringOption((option) =>
          option
            .setName("asset_id")
            .setDescription("the asset with the tags to remove")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("tags").setDescription("the tags to remove").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("command")
        .setDescription("Remove a tag from a command")
        .addStringOption((option) =>
          option
            .setName("command")
            .setDescription("the command to remove the tags from")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("tags").setDescription("the tags to remove").setRequired(true)
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (interaction.options.getSubcommand() === "asset") {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      }
      const assetId = interaction.options.getString("asset_id", true);
      const tags = stringToTags(interaction.options.getString("tags", true));

      const collection = await getAssetCollection(
        await connectToDatabase(process.env.MONGODB_URI!)
      );

      const state = await collection.findOne({ id: assetId });
      if (!state) {
        interaction.editReply({
          content: "No matching asset found.",
        });
        return;
      }

      state.tags = state.tags.filter((tag) => !tags.includes(tag));
      await collection.updateOne({ id: assetId }, { $set: { tags: state.tags } });
      interaction.editReply({
        content: `Removed tags ${tags.join(", ")} from asset ${assetId}.`,
      });
      return;
    }
    if (interaction.options.getSubcommand() === "command") {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      }
      const command = interaction.options.getString("command", true);
      const tags = stringToTags(interaction.options.getString("tags", true));
      const commandsCollection = await getCommandCollection(
        await connectToDatabase(process.env.MONGODB_URI!)
      );
      const [commandDoc] = await commandsCollection.find({ name: command }).toArray();
      if (!commandDoc) {
        interaction.editReply({
          content: "No matching command found.",
        });
        return;
      }
      commandDoc.tags = commandDoc.tags.filter((tag) => !tags.includes(tag));
      await commandsCollection.updateOne({ name: command }, { $set: { tags: commandDoc.tags } });
      interaction.editReply({
        content: `Removed tags ${tags.join(", ")} from command ${command}.`,
      });
      return;
    }
  },
};
