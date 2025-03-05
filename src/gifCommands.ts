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
