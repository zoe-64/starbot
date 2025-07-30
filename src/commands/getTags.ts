import type { ChatInputCommandInteraction } from "discord.js";
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { connectToDatabase, getAssetCollection } from "../db.js";
export default {
  data: new SlashCommandBuilder()
    .setName("gettags")
    .setDescription("Gets all the tags that are being used"),

  async execute(interaction: ChatInputCommandInteraction) {
    const assetCollection = await getAssetCollection(
      await connectToDatabase(process.env.MONGODB_URI!)
    );
    const assets = await assetCollection.find({}).toArray();
    const tags: Record<string, number> = {};
    for (const asset of assets) {
      for (const tag of asset.tags) {
        tags[tag] = (tags[tag] || 0) + 1;
      }
    }
    const sortedTags = Object.keys(tags).sort((a, b) => tags[b] - tags[a]);
    interaction.reply({
      content: sortedTags.join(", "),
      flags: MessageFlags.Ephemeral,
    });
  },
};
