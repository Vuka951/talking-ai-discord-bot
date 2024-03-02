const Discord = require("discord.js");
const { getVoiceConnection } = require("@discordjs/voice");
const { deploy } = require("./discord/deploy");
const { interactionHandlers } = require("./discord/interactions");
const { startUp } = require("./utils/helpers");

const { token } = require("../auth.json"); // discord token import

const client = new Discord.Client({
  intents: ["GUILD_VOICE_STATES", "GUILD_MESSAGES", "GUILDS"],
});

client.on("ready", () => {
  startUp();
  console.log("Ready!");
});

client.on("messageCreate", async (message) => {
  if (!message.guild) return;
  if (!client.application?.owner) await client.application?.fetch();

  if (
    message.content.toLowerCase() === "!deploy" &&
    message.author.id === client.application?.owner?.id
  ) {
    // needs to be ran in a channel to deploy the bot allowing for commands to work when you '/*'
    await deploy(message.guild);
    await message.reply("Deployed!");
  }
});

/**
 * The IDs of the users that can be recorded by the bot.
 */
const recordable = new Set();

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand() || !interaction.guildId) return;

  const handler = interactionHandlers.get(interaction.commandName);

  try {
    if (handler) {
      await handler(
        interaction,
        recordable,
        client,
        getVoiceConnection(interaction.guildId)
      );
    } else {
      await interaction.reply("Unknown command");
    }
  } catch (error) {
    console.warn(error);
  }
});

client.on("error", console.warn);

client.login(token);
