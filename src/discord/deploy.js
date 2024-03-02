const deploy = async (guild) => {
  await guild.commands.set([
    {
      name: "join",
      description: "Joins the voice channel that you are in",
    },
    {
      name: "listen",
      description: "Enables listening for the user",
      options: [
        {
          name: "speaker",
          type: "USER",
          description: "The user to listen to",
          required: true,
        },
      ],
    },
    {
      name: "nolisten",
      description: "Disables listening for the user",
    },
    {
      name: "leave",
      description: "Leave the voice channel",
    },
    {
      name: "trigger",
      description: "Send a promp to the AI and it will respond in chat",
      options: [
        {
          name: "prompt",
          type: "STRING",
          description: "The text prompt",
          required: true,
        },
      ],
    },
  ]);
};

module.exports = {
  deploy,
};
