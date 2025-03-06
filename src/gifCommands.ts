import {
  CommandInteraction,
  GuildMember,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import * as fs from "fs";
import * as path from "path";
interface GifCommandData {
  commands: {
    [commandName: string]: {
      templates: {
        self: string[];
        multiple: string[];
      };
      self: string[];
      multiple: string[];
      both: string[];
    };
  };
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
const fallbackTemplates = {
  self: ["%sender%: %gif%"],
  multiple: ["%receiver%: Consider the following:"],
};
export function checkAndExecuteGifCommand(interaction: CommandInteraction) {
  const gifCommands = loadGifCommands();
  const gifCommand = gifCommands.commands[interaction.commandName];
  if (!gifCommand) return;
  const targetOption = interaction.options.get("target") as {
    member: GuildMember;
  } | null;
  const target = targetOption?.member ?? interaction.user;
  const gifs: { gif: string; type: string }[] = targetOption
    ? [
        ...gifCommand.multiple.map((gif) => ({ gif, type: "multiple" })),
        ...gifCommand.both.map((gif) => ({ gif, type: "both" })),
      ]
    : [
        ...gifCommand.self.map((gif) => ({ gif, type: "self" })),
        ...gifCommand.both.map((gif) => ({ gif, type: "both" })),
      ];

  if (gifs.length === 0) {
    interaction.reply("There are no GIFs available for this command.");
    return;
  }
  const indexOption = interaction.options.get("index", false) as
    | { value: string }
    | undefined;
  let index = indexOption ? indexOption.value : null;

  if (!index || !/\d+-(self|multiple|both)/.test(index)) {
    index = `${Math.floor(Math.random() * gifs.length)}-self`;
  }
  const [indexString, _type] = index.split("-");
  const selectedGif = gifs[Number(indexString)];
  const type = targetOption ? "multiple" : "self";
  if (selectedGif) {
    // pick a random message template based on type
    const templates =
      gifCommand.templates && gifCommand.templates[type]
        ? gifCommand.templates[type]
        : fallbackTemplates[type];
    const message = templates[Math.floor(Math.random() * templates.length)];

    interaction.reply(
      message
        .replace(
          /%sender%/g,
          interaction.user.displayName ?? interaction.user.id
        )
        .replace(
          /%receiver%/g,
          targetOption?.member?.nickname ??
            targetOption?.member.user.globalName ??
            targetOption?.member.user.username ??
            targetOption?.member.id ??
            ""
        ) + `\n [GIF](${selectedGif.gif}) Index: ${index}`
    );

    return;
  }
  interaction.reply("Invalid GIF index.");
}
