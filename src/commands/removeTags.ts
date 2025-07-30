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
            .setName("asset")
            .setDescription("the asset to remove the tags from")
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
      state.tags = state.tags.filter((tag) => !tags.includes(tag));
      await collection.updateOne({ id: asset }, { $set: { tags: state.tags } });
      interaction.reply({
        content: `Removed tags ${tags.join(", ")} from asset ${asset}.`,
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
      commandDoc.tags = commandDoc.tags.filter((tag) => !tags.includes(tag));
      await commandsCollection.updateOne({ name: command }, { $set: { tags: commandDoc.tags } });
      interaction.reply({
        content: `Removed tags ${tags.join(", ")} from command ${command}.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
  },
};
