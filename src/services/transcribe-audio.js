// Imports the Google Cloud client library
const speech = require("@google-cloud/speech");
const fs = require("fs");
const { language } = require("../../settings.json");

// Creates a client
const client = new speech.SpeechClient();

// The audio file's encoding, sample rate in hertz, and BCP-47 language code
const CONFIG = {
  SRB: {
    encoding: "OGG_OPUS",
    sampleRateHertz: 16000,
    languageCode: "sr-RS",
    enableWordTimeOffsets: false,
  },
  ENG: {
    encoding: "OGG_OPUS",
    sampleRateHertz: 16000,
    languageCode: "en-US",
    enableWordTimeOffsets: false,
  },
  CZE: {
    encoding: "OGG_OPUS",
    sampleRateHertz: 16000,
    languageCode: "cs-CZ",
    enableWordTimeOffsets: false,
  },
};

const transcribeAudio = async (filename) => {
  console.log(`✍️Started transcribing audio`);

  // Read the content of the local audio file
  const audioFileContent = fs.readFileSync(filename).toString("base64");

  const audio = {
    content: audioFileContent,
  };

  const request = {
    audio: audio,
    config: CONFIG[language],
  };

  // Detects speech in the audio file
  const [response] = await client.recognize(request);
  const transcription = response.results.map(
    (result) => result.alternatives[0].transcript
  );
  console.log(`✍️Transcription: ${transcription}`);
  // If you want to write the transcription in a file or send it somewhere for logging do it here
  // fs.writeFileSync("transcription.txt", `${transcription}`);
  return transcription;
};

module.exports = {
  transcribeAudio,
};
