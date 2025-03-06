import {
  CommandInteraction,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import * as fs from "fs";
import * as path from "path";

interface GifCommandData {
  commands: { [commandName: string]: string[] };
}
const gifCommandsFilePath = path.join(__dirname, "gifCommands.json");
export function loadGifCommands(): GifCommandData {
  try {
    const data = fs.readFileSync(gifCommandsFilePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading gif commands:", error);
    return { commands: {} };
  }
}

export function saveGifCommands(data: GifCommandData): void {
  try {
    fs.writeFileSync(gifCommandsFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving gif commands:", error);
  }
}
export function checkAndExecuteGifCommand(interaction: CommandInteraction) {
  const gifCommands = loadGifCommands();
  const gifUrls = gifCommands.commands[interaction.commandName];

  if (!gifUrls) return;

  const option = interaction.options.get("index", false);
  let index = null;

  if (gifUrls && gifUrls.length > 0) {
    let selectedGif;
    let selectedIndex;

    if (
      index !== undefined &&
      index !== null &&
      index >= 0 &&
      index < gifUrls.length
    ) {
      selectedGif = gifUrls[index];
      selectedIndex = index;
    } else {
      selectedIndex = Math.floor(Math.random() * gifUrls.length);
      selectedGif = gifUrls[selectedIndex];
    }

    interaction.reply(`GIF Index: ${selectedIndex}`).then(() => {
      interaction.followUp(selectedGif);
    });

    return;
  }
  interaction.reply("There are no GIFs available for this command.");
}
