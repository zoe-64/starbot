import type { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "discord.js";
import { connectToDatabase, getAssetCollection, getCommandSentenceCollection } from "../db.js";
export default {
  data: new SlashCommandBuilder()
    .setName("generatemiscdata")
    .setDescription("Adds misc data to entries in the database"),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }

    // go through all sentences and add ids if they don't have one
    const sentenceCollection = await getCommandSentenceCollection(
      await connectToDatabase(process.env.MONGODB_URI!)
    );
    let sentencesWithoutId = 0;
    const sentences = await sentenceCollection.find({}).toArray();
    for (const sentence of sentences) {
      if (!sentence.id) {
        sentence.id = Math.random().toString(36).substring(2, 15);
        sentencesWithoutId++;
        await sentenceCollection.updateOne({ _id: sentence._id }, { $set: { id: sentence.id } });
      }
    }

    // look for lonely tags (only used once or twice)

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

    const lonelyTags = Object.keys(tags).filter((tag) => tags[tag] <= 2);
    if (lonelyTags.length > 0) {
      interaction.editReply({
        content: `Found ${lonelyTags.join(", ")} as lonely tags.`,
      });
      return;
    }
    if (sentencesWithoutId > 0) {
      interaction.editReply({
        content: `Found ${sentencesWithoutId} sentences without an id.`,
      });
      return;
    }
    interaction.editReply({
      content: "No issues found.",
    });
  },
};
