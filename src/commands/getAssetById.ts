import type { ChatInputCommandInteraction } from "discord.js";
import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { connectToDatabase, getAssetCollection } from "../db.js";
import { getUserFromId } from "../utility.js";
export default {
  data: new SlashCommandBuilder()
    .setName("getassetbyid")
    .setDescription("Get an asset by id")
    .addStringOption((option) =>
      option.setName("asset_id").setDescription("The id of the asset").setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }
    const assetId = interaction.options.getString("asset_id", true);

    const collection = await getAssetCollection(await connectToDatabase(process.env.MONGODB_URI!));
    const asset = await collection.findOne({ id: assetId });
    if (!asset) {
      interaction.editReply({
        content: "No matching asset found.",
      });
      return;
    }
    const like_users = asset.likes
      .map((id) => getUserFromId(id) ?? id)
      .map((user) => (typeof user === "string" ? user : user?.displayName + ` (${user?.id})`));
    const dislike_users = asset.dislikes
      .map((id) => getUserFromId(id) ?? id)
      .map((user) => (typeof user === "string" ? user : user?.displayName + ` (${user?.id})`));
    const user = getUserFromId(asset.addedBy);
    const embed = new EmbedBuilder()
      .setTitle(`[${asset.id}] ${asset.type}`)
      .addFields([
        {
          name: "Tags",
          value: asset.tags.join(", "),
        },
        {
          name: "URL",
          value: asset.url,
        },
        {
          name: "Likes",
          value: like_users.length === 0 ? "None" : like_users.join(", "),
        },
        {
          name: "Dislikes",
          value: dislike_users.length === 0 ? "None" : dislike_users.join(", "),
        },
      ])
      .setFooter({
        text: `Added by ${
          user
            ? `${user.displayName} ${new Date(asset.addedAt).toDateString()}`
            : `user unknown ${asset.addedBy}`
        }`,
        iconURL: user?.displayAvatarURL(),
      })
      .setImage(asset.url);
    interaction.editReply({
      embeds: [embed],
    });
  },
};
