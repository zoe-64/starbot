import type { ChatInputCommandInteraction, TextChannel } from "discord.js";
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types.js";
import { getExcludeTags, stringToTags } from "../utility.js";
import { connectToDatabase, getCommandCollection } from "../db.js";
export default {
  data: new SlashCommandBuilder()
    .setName("addassetcommand")
    .setDescription("Add a command that sends a gif or an image from the pool")
    .addStringOption((option) =>
      option.setName("name").setDescription("The name of the command.").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("tags")
        .setDescription("Comma-separated tags: -[tag] = exclude")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const [tags, excludes] = getExcludeTags(
      stringToTags(interaction.options.getString("tags", true))
    );
    const name = interaction.options.getString("name", true);

    const command: BotCommand = {
      name: name.toLocaleLowerCase(),
      tags: tags,
      excludes: excludes,
      usageCount: 0,
      addedBy: interaction.user.id,
      addedAt: new Date(),
    };
    const collection = await getCommandCollection(
      await connectToDatabase(process.env.MONGODB_URI!)
    );
    await collection.insertOne(command);

    const channel = interaction.client.channels.cache.get("1347097892996907078") as
      | TextChannel
      | undefined;
    if (channel) {
      channel.send(`command: ${name} added with tags ${tags} and excludes ${excludes}`);
    }

    interaction.reply({
      content: `command: ${name} added with tags ${tags} and excludes ${excludes}!`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
