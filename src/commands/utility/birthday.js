const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["birthday", "bday", "setbday"],
  category: "Utility",
  desc: "Set your birth date to receive automatic birthday announcements.",
  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const dateInput = args[0]; // e.g. 15/08 or 2005-08-15

    if (!dateInput) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🎂 Birthday Tracker\n` +
          `-# *Never miss a friend's birthday celebration.*\n\n` +
          `> - **Usage:** \`.birthday set DD/MM\` (e.g. \`.birthday set 25/12\`)\n` +
          `> - **Usage:** \`.birthday view [@user]\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🎂 Birthday Registered\n` +
        `-# *Your birthday has been saved successfully.*\n\n` +
        `> - **Date:** \`${dateInput}\` | **User:** ${message.author.username}`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
