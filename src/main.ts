import {
  Client,
  CommandInteraction,
  GatewayIntentBits,
  Interaction,
  Message,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import * as dotenv from "dotenv";
import { TransformFilter, transformWords } from "./transform";

dotenv.config();

const rewards: {
  [key: string]: { reward: (message: Message) => void; chance: number };
} = {
  "Extra Star": {
    reward: (message: Message) => {
      goldenStars[message.author.id] =
        (goldenStars[message.author.id] || 0) + 1;
      message.reply(
        `One extra star for you, ${message.author.displayName}! You now have ${
          goldenStars[message.author.id]
        }.`
      );
    },
    chance: 0.5,
  },
  "Diaper Rub": {
    reward: (message: Message) => {
      const rubs = [
        "https://cdn.discordapp.com/attachments/1246127470378356840/1344763516552478784/w.gif",
        "https://cdn.discordapp.com/attachments/1344399134714626179/1344763168592887808/01448a1480c01c045012c4d9b713fea31.gif?",
      ];
      const randomRub = rubs[Math.floor(Math.random() * rubs.length)];
      message.reply(
        `${randomRub}\n Feel good ${message.author.displayName}? Bet it does. `
      );
    },
    chance: 0.5,
  },
  "Head Pat": {
    reward: (message: Message) => {
      const pats = [
        "https://tenor.com/view/anime-girl-gif-19660588",
        "https://tenor.com/view/fallenshadow-baby-pacifier-vtuber-shondo-gif-27171057",
      ];
      const randomPat = pats[Math.floor(Math.random() * pats.length)];
      message.reply(
        `${randomPat}\n ${message.author.displayName}, who's a good baby? You are. `
      );
    },
    chance: 0.5,
  },
};
const punishments: {
  [key: string]: { punishment: (message: Message) => void; weight: number };
} = {
  "Light Spank": {
    punishment: (message: Message) => {
      const spanks = [
        "https://cdn.discordapp.com/attachments/1339878614249898035/1341477324578623569/tumblr_65a47b1a3abcd1451b98b73ea3eb1076_5933c63c_250.webp",
        "https://31.media.tumblr.com/f58268f3f35242718bd45c3e4b2f590e/tumblr_ovfntllnbK1w5nrb0o1_250.gif",
      ];
      const randomSpank = spanks[Math.floor(Math.random() * spanks.length)];
      message.reply(
        `${randomSpank} \nIf you continue like this ${message.author.displayName}, you'll feel more than this...`
      );
    },
    weight: 2,
  },
  Spank: {
    punishment: (message: Message) => {
      const spanks = [
        "https://wimg.rule34.xxx//images/1/c78103b923c8c056b997233ab9234787.gif?9358229",
        "https://img3.gelbooru.com/images/54/e5/54e5800b0c8b3ce5bb6151ab2aed4ca8.gif",
        "https://cumception.com/wp-content/upload/2022/12/diaper_position_span-980.gif",
        "https://xxgasm.com/wp-content/upload/2018/08/spanking_ma-4206.gif",
      ];
      const randomSpank = spanks[Math.floor(Math.random() * spanks.length)];
      message.reply(
        `${randomSpank} \n${message.author.displayName}, does it hurt yet?`
      );
    },
    weight: 1,
  },
  Bondage: {
    punishment: (message: Message) => {
      const bondages = [
        "https://wimg.rule34.xxx//images/6228/5d544b1341743126d506c490f69a1bd0.jpeg?7087761",
        "https://wimg.rule34.xxx//samples/6222/sample_398474c543e645b4ae0dfa6a60d8f3d8.jpg?7081992",
        "https://wimg.rule34.xxx//images/5673/ff1a046b4661c2c0c05c87eed7a8b31e.jpeg?6452418",
      ];
      const randomBondage =
        bondages[Math.floor(Math.random() * bondages.length)];
      message.reply(
        `${randomBondage} \nBe a good baby ${message.author.displayName}, otherwise you'll be sorry... `
      );
    },
    weight: 1,
  },
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const token = process.env.BOT_TOKEN;
const channelId = process.env.CHANNEL_ID;

if (!token || !channelId) {
  console.error("Missing BOT_TOKEN or CHANNEL_ID in .env file.");
  process.exit(1);
}

const goldenStars: { [userId: string]: number } = {};

const starsCommand = new SlashCommandBuilder()
  .setName("stars")
  .setDescription("Check how many golden stars you have!");

const testTranslateCommand = new SlashCommandBuilder()
  .setName("translate")
  .setDescription("Translate a message")
  .addStringOption((option) =>
    option
      .setName("message")
      .setDescription("The message to translate")
      .setRequired(true)
  );

client.once("ready", () => {
  console.log("Bot is ready!");

  client.application?.commands.create(starsCommand);
  client.application?.commands.create(testTranslateCommand);
});
const filters: TransformFilter[] = [
  [{ regex: /sl|\'/g, replace: "" }],
  // replacement
  [
    { regex: /girl/g, replace: "gawi" },
    { regex: /water/g, replace: "wawa" },
    { regex: /the/g, replace: "da" },
  ],

  // letter drops
  [
    { regex: /(nt)$/g, replace: "n" },
    { regex: /(ter)$/g, replace: "te" },
    { regex: /(ing)$/g, replace: "in" },
    { regex: /(ve)$/g, replace: "v" },
  ],

  { regex: /(er)$|(et)$/g, replace: "ie" },
  [
    { regex: /th(?=[ri])/g, replace: "f" },
    { regex: /th/g, replace: "d" },
  ],
  [
    { regex: /^l/g, replace: "w" },
    { regex: /llo/g, replace: "wo" },
    { regex: /ll/g, replace: "wl" },
    { regex: /ri|l|r/g, replace: "w" },
  ],
  { regex: /time|tim/g, replace: "im" },
  { regex: /sh/g, replace: "ss" },
  { regex: /s(?!\b)/g, replace: "sh" },
  { regex: /good/g, replace: "gud" },
];

client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === testTranslateCommand.name) {
    const message = (interaction as CommandInteraction).options.get(
      "message",
      true
    ).value as string;
    await interaction.reply(transformWords(message, filters));
    return;
  }

  if (interaction.commandName === starsCommand.name) {
    const stars = goldenStars[interaction.user.id] || 0;
    await interaction.reply(`You have ${stars} golden stars.`);
    return;
  }
});

client.on("messageCreate", async (message: Message) => {
  if (message.author.bot) return; // Ignore messages from bots
  if (message.channel.id !== channelId) return; // Only listen in the specified channel
  const isNotText = (word: string) => {
    return /(:.+:)|\[|{\(|(http)/gm.test(word);
  };

  const inputWords = message.content
    .toLowerCase()
    .split(" ")
    .filter((word) => !isNotText(word));
  const transformedContent = transformWords(
    message.content.toLowerCase(),
    filters
  );
  const correctWords = transformedContent.split(" ");

  const isName = (word: string) => {
    return message.guild?.members.cache.some(
      (member) => member.displayName.toLowerCase() === word
    );
  };

  const incorrectWords = inputWords.filter((word, index) => {
    return !isName(word) && word !== correctWords[index];
  });

  if (incorrectWords.length > 0) {
    const word =
      incorrectWords[Math.floor(Math.random() * incorrectWords.length)];
    const babyMessage = await (message.channel as TextChannel).send(
      `${
        message.author
      }, your message was not very baby-like because you said '${word}', try again and say "${transformWords(
        word,
        filters
      )}".`
    );
    setTimeout(async () => {
      await message.delete();
      await babyMessage.delete();
    }, 5000);
    goldenStars[message.author.id] = Math.max(
      (goldenStars[message.author.id] || 0) - 1,
      0
    ); // Ensure stars don't go negative
    const chance = Math.random();
    const weightSum = Object.values(punishments).reduce(
      (acc, cur) => acc + cur.weight,
      0
    );
    const randomWeight = Math.random() * weightSum;
    let cumulativeWeight = 0;
    let randomPunishment: string = punishments["Light Spank"].punishment.name;
    Object.entries(punishments).some(([key, { weight }]) => {
      cumulativeWeight += weight;
      if (cumulativeWeight >= randomWeight) {
        randomPunishment = key;
        return true;
      }
      return false;
    });

    if (chance < 0.33 && randomPunishment) {
      punishments[randomPunishment].punishment(message);
    }
  } else if (inputWords.length > 2) {
    goldenStars[message.author.id] = (goldenStars[message.author.id] || 0) + 1;
    message.react("⭐");
    const randomReward =
      Object.keys(rewards)[
        Math.floor(Math.random() * Object.keys(rewards).length)
      ];
    const chance = rewards[randomReward].chance;
    if (Math.random() < chance) {
      rewards[randomReward].reward(message);
    }
  }
});

client.login(token);
