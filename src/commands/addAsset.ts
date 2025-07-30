import type { ChatInputCommandInteraction, TextChannel } from "discord.js";
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { Asset } from "../types.js";
import { downloadImage, stringToTags } from "../utility.js";
import { connectToDatabase, getAssetCollection } from "../db.js";
export default {
  data: new SlashCommandBuilder()
    .setName("addasset")
    .setDescription("Add a gif or an image to the pool")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Type of asset (gif or image)")
        .setRequired(true)
        .addChoices({ name: "Gif", value: "Gif" }, { name: "Image", value: "Image" })
    )
    .addStringOption((option) =>
      option.setName("url").setDescription("Image URL").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("tags").setDescription("Comma-separated tags").setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const url = interaction.options.getString("url", true);
    const tags = stringToTags(interaction.options.getString("tags", true));
    const type = interaction.options.getString("type", true).toLowerCase();
    if (!tags.includes(type)) {
      tags.push(type);
    }
    const id = Math.random().toString(36).substring(2, 15);
    downloadImage(
      url,
      `images/${type === "image" ? "png" : type}/${id}.${type === "image" ? "png" : type}`
    );

    const asset: Asset = {
      id,
      url,
      filePath: `images/${type}/${id}.${type}`,
      tags: tags,
      type: type.toLowerCase() as "gif" | "image",
      addedBy: interaction.user.id,
      addedAt: new Date(),
      usageCount: 0,
      likes: [],
      dislikes: [],
    };

    const collection = await getAssetCollection(await connectToDatabase(process.env.MONGODB_URI!));
    await collection.insertOne(asset);

    const channel = interaction.client.channels.cache.get("1347097892996907078") as
      | TextChannel
      | undefined;
    if (channel) {
      channel.send(`[${id}] ${tags} ${type} added: ${url}`);
    }

    interaction.reply({
      content: `${type} added ${url} with tags ${tags}!`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
