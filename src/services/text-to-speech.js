// Imports the Google Cloud client library
const textToSpeech = require("@google-cloud/text-to-speech");

// Import other required libraries
const fs = require("fs");
const util = require("util");
const { language } = require("../../settings.json");

// Creates a client
const client = new textToSpeech.TextToSpeechClient();

// A list of available voices can be found: https://cloud.google.com/text-to-speech/docs/voices
const VOICES = {
  SRB: { languageCode: "sr-RS", name: "sr-RS-Standard-A" },
  ENG: { languageCode: "en-GB", name: "en-GB-Standard-A" },
  CZE: { languageCode: "cs-CZ", name: "cs-CZ-Standard-A" },
};

async function createVoiceResponse(text, userId, now) {
  // Construct the request
  const request = {
    input: { text: text },
    // Select the language and SSML voice gender (optional)
    voice: VOICES[language],
    // select the type of audio encoding
    audioConfig: { audioEncoding: "LINEAR16", pitch: 0, speakingRate: 1 },
  };

  // Performs the text-to-speech request
  const [response] = await client.synthesizeSpeech(request);
  // Write the binary audio content to a local file
  const writeFile = util.promisify(fs.writeFile);
  await writeFile(
    `./audio/${now}-${userId}-response.mp3`,
    response.audioContent,
    "binary"
  );
  console.log(
    `🎶💾Audio content written to file: ./audio/${now}-${userId}-response.mp3`
  );
}
module.exports = {
  createVoiceResponse,
};
