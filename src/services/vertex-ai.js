const { VertexAI } = require("@google-cloud/vertexai");
const { language } = require("../../settings.json");

const languageName = {
  SRB: "serbian",
  ENG: "english",
  CZE: "czech",
};

const AISetupText = `
From now can you respond to me as if we were playing Dungeons and dragons.
You are X president of the council of corruption and you also have a nickname "Pera".
We are currently in a big meeting. You always work hard but you just cant do everything yourself.
You are also the godfather of Gazda Marko who you help out a lot but secretly think he is a bad corrput person.
Can you also respond only in the ${languageName[language]} language as if you were talking to someone in a normal everyday conversation
`;

const MAX_CHARATERS = {
  SRB: ". Odgovori sa maksimum 100 karaktera",
  ENG: ". Answer with a maximum of 100 characters",
};

// Initialize Vertex with your Cloud project and location
const vertex_ai = new VertexAI({
  project: "speech-text-bot",
  location: "us-central1",
});
// Available models: https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models?_gl=1*nrvc9i*_ga*MzY3NzgzNTcyLjE3MDY4NzU4OTY.*_ga_WH2QY8WWF5*MTcwOTQwOTg3NS4xMS4xLjE3MDk0MTA2NjUuMC4wLjA.&_ga=2.70512658.-367783572.1706875896#gemini-models
const model = "gemini-1.0-pro-001";

// Instantiate the models
const generativeModel = vertex_ai.preview.getGenerativeModel({
  model: model,
  generation_config: {
    max_output_tokens: 2048,
    temperature: 1,
    top_p: 1,
  },
  safety_settings: [
    // Available options https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/configure-safety-attributes#safety_settings
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_ONLY_HIGH",
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_ONLY_HIGH",
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_ONLY_HIGH",
    },
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_ONLY_HIGH",
    },
  ],
});

async function handleAIResponse(response) {
  const responseText = response.parts[0].text;
  console.log(`🤖AI TEXT Response: ${responseText}`);
  // When the Vertex AI errors out because of a "innapropriate response"
  // it doesnt send an error but just and empty '' as a response
  if (responseText.length === 0) {
    // restarts the chat with the AI so you dont have to restart the bot
    await AISetup();
    return "";
  }
  return responseText;
}

// Making it a let so it can be reassinged/reset when the model stops responding
// Could be made into an object and set/reset for each server/chat so each chat/server/voice could be
// separate seesion but then it would rate limit quicking and im not paying money for a for fun discord bot
let chat;

// Sends the setup msg to the AI to start the chat
async function AISetup() {
  chat = generativeModel.startChat({});
  const userMessage0 = [
    {
      text: AISetupText,
    },
  ];
  const streamResult0 = await chat.sendMessageStream(userMessage0);
  // Logs first response
  console.dir((await streamResult0.response).candidates[0].content);
}

async function askAIVoice(text) {
  try {
    // Limit to 100 char in the since google text to speech is around 1min (Free)
    const userMessage0 = [{ text: String(text) + MAX_CHARATERS[language] }];
    const streamResult0 = await chat.sendMessageStream(userMessage0);
    const response = (await streamResult0.response).candidates[0].content;
    console.log(response);

    return handleAIResponse(response);
  } catch (err) {
    console.log("🤢Vertex AI error: ");
    console.error(err);
    return;
  }
}

async function askAIText(text) {
  try {
    const userMessage0 = [{ text: String(text) }];
    const streamResult0 = await chat.sendMessageStream(userMessage0);
    const response = (await streamResult0.response).candidates[0].content;
    console.log(response);

    return handleAIResponse(response);
  } catch (err) {
    console.log("🤢Vertex AI error: ");
    console.error(err);
    return;
  }
}

module.exports = {
  askAIVoice,
  askAIText,
  AISetup,
};
