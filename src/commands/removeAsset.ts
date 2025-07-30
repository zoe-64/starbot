import type { ChatInputCommandInteraction, TextChannel } from "discord.js";
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { connectToDatabase, getAssetCollection } from "../db.js";
import { deleteImage } from "../utility.js";
export default {
  data: new SlashCommandBuilder()
    .setName("removeasset")
    .setDescription("Remove a gif or an image from the pool")
    .addStringOption((option) =>
      option.setName("asset_id").setDescription("The id of the asset").setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    }
    const assetId = interaction.options.getString("asset_id", true);

    const collection = await getAssetCollection(await connectToDatabase(process.env.MONGODB_URI!));
    const asset = await collection.findOneAndDelete({ id: assetId });
    if (!asset) {
      interaction.editReply({
        content: "No matching asset found.",
      });
      return;
    }
    await deleteImage(
      `images/${asset.type === "image" ? "png" : asset.type}/${asset.id}.${
        asset.type === "image" ? "png" : asset.type
      }`
    );
    const channel = interaction.client.channels.cache.get("1347097892996907078") as
      | TextChannel
      | undefined;
    if (channel) {
      channel.send(`[${asset.id}] ${asset.tags} ${asset.type} removed: ${asset.url}`);
    }

    interaction.editReply({
      content: `[${asset.id}] ${asset.tags} ${asset.type} removed: ${asset.url}`,
    });
  },
};
