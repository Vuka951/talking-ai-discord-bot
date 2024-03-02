const { EndBehaviorType } = require("@discordjs/voice");
const { createWriteStream } = require("node:fs");
const { pipeline } = require("node:stream");
const { transcribeAudio } = require("../services/transcribe-audio");
const { askAIVoice } = require("../services/vertex-ai");
const { createVoiceResponse } = require("../services/text-to-speech");
const { deleteFile, createOggStream } = require("./helpers");
const { promisify } = require("util");

const pipelineAsync = promisify(pipeline);

async function createListeningStream(receiver, userId, filename, recordable) {
  // Create opus and ogg streams
  const opusStream = receiver.subscribe(userId, {
    end: {
      behavior: EndBehaviorType.AfterInactivity,
      duration: 2000,
    },
  });
  const oggStream = createOggStream();

  const outputStream = createWriteStream(filename);

  console.log(`👂 Started recording ${filename}`);

  await pipelineAsync(opusStream, oggStream, outputStream);

  console.log(`✅ Recorded ${filename}`);

  // Stop listening, this can be removed if you want it to continuously listen to you
  if (recordable) {
    recordable.clear(); // removes all users
    // recordable.delete(userId); causes memory leaks
    console.log(`❌👂Stopped listening to: ${userId}`);
  }
}

async function handleListening(receiver, userId, subscription, recordable) {
  // Generate filename
  const now = Date.now();
  const filename = `./audio/${now}-${userId}-voice.ogg`;
  try {
    await createListeningStream(receiver, userId, filename, recordable);

    // Transcribe audio
    const transcription = await transcribeAudio(filename);
    if (String(transcription).length < 5) {
      throw new Error("🤢No text to send to AI");
    }

    // Ask AI for response
    const AIResponse = await askAIVoice(transcription);
    if (AIResponse.length < 5) {
      throw new Error("🤢No response from AI");
    }

    // Create voice response
    await createVoiceResponse(AIResponse, userId, now);

    // Enqueue response
    subscription.enqueue(`./audio/${now}-${userId}-response.mp3`);

    console.log("🏁Finished Everything");
  } catch (err) {
    console.error(err);
  } finally {
    // Clean up
    deleteFile(filename);
  }
}

module.exports = {
  handleListening,
};
