const {
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
} = require("@discordjs/voice");
const { GuildMember } = require("discord.js");
const { handleListening } = require("../utils/handleListening");
const { MusicSubscription } = require("./subscription");
const { askAIText } = require("../services/vertex-ai");

/**
 * Maps guild IDs to music subscriptions, which exist if the bot has an active VoiceConnection to the guild.
 */
const subscriptions = new Map();

async function join(interaction, recordable, client, connection) {
  await interaction.deferReply();
  if (!connection) {
    if (
      interaction.member instanceof GuildMember &&
      interaction.member.voice.channel
    ) {
      const channel = interaction.member.voice.channel;
      connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        selfDeaf: false, // needs to be false for listening to work
        selfMute: false,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });

      // If a connection to the guild doesn't already exist and the user is in a voice channel, join that channel
      // and create a subscription.
      const subscription = new MusicSubscription(connection);
      subscription.voiceConnection.on("error", console.warn);
      subscriptions.set(interaction.guildId, subscription);
    } else {
      await interaction.followUp(
        "Join a voice channel and then try that again!"
      );
      return;
    }
  }

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
    const receiver = connection.receiver;

    receiver.speaking.on("start", (userId) => {
      if (recordable.has(userId)) {
        let subscription = subscriptions.get(interaction.guildId);
        handleListening(receiver, userId, subscription, recordable);
      }
    });
  } catch (error) {
    console.warn(error);
    await interaction.followUp(
      "Failed to join voice channel within 20 seconds, please try again later!"
    );
  }

  await interaction.followUp("Ready!");
}

async function record(interaction, recordable, client, connection) {
  if (connection) {
    const userId = interaction.options.get("speaker")?.value;
    recordable.add(userId);

    const receiver = connection.receiver;
    if (connection.receiver.speaking.users.has(userId)) {
      let subscription = subscriptions.get(interaction.guildId);
      handleListening(receiver, userId, subscription, recordable);
    }
    // ephemeral means the msg is only shown to you
    await interaction.reply({ ephemeral: true, content: "I am listening!" });
  } else {
    await interaction.reply({
      ephemeral: true,
      content: "Join a voice channel and then try that again!",
    });
  }
}

async function leave(interaction, recordable, client, connection) {
  if (connection) {
    connection.destroy();
    recordable.clear();
    await interaction.reply({ ephemeral: true, content: "Left the channel!" });
  } else {
    await interaction.reply({
      ephemeral: true,
      content: "Not playing in this server!",
    });
  }
}

async function stopRecording(interaction, recordable, client, connection) {
  if (connection) {
    const userId = interaction.options.get("speaker")?.value;
    recordable.delete(userId);

    // Remove the user from the speaking event listener? But the remove on speaker doesnt work individual users? 🤔
    // The removeAllListeners stops listening for all users and you need to rejoin to restart any listening since #52 is removed
    // connection.receiver.speaking.removeAllListeners("start");

    await interaction.reply({ ephemeral: true, content: "Stopped recording!" });
  } else {
    await interaction.reply({
      ephemeral: true,
      content: "Join a voice channel and then try that again!",
    });
  }
}

async function respondToPrompt(interaction, recordable, client, connection) {
  await interaction.deferReply();

  const AIRequestText = interaction.options.get("prompt")?.value;
  console.log(`AI request text: ${AIRequestText}`);
  if (AIRequestText.length < 5) {
    return await interaction.reply("No enough text for 🤖 to respond ");
  } else {
    try {
      const AIResponse = await askAIText(AIRequestText);
      if (String(AIResponse).length < 5) {
        throw new Error("🤢No response from AI");
      }
      // Reply to the interaction with the AIResponse text
      await interaction.followUp(AIResponse);
    } catch (error) {
      console.log(error);
      await interaction.followUp("Error No response from 🤖");
    }
  }
}

const interactionHandlers = new Map();
interactionHandlers.set("join", join);
interactionHandlers.set("listen", record);
interactionHandlers.set("leave", leave);
interactionHandlers.set("nolisten", stopRecording);
interactionHandlers.set("trigger", respondToPrompt);

module.exports = {
  interactionHandlers,
  subscriptions,
};
