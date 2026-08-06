const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const welcomeManager = require("../../lib/welcomeManager");

module.exports = {
  alias: ["joindmenable", "joindm-on"],
  category: "Welcome",
  desc: "Enable Direct Message greeting to joining members.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const text = args.join(" ") || "Welcome to **{server}**! Enjoy your stay!";

    welcomeManager.updateGuildWelcome(message.guild.id, {
      joinDmEnabled: true,
      joinDmText: text,
    });

    const preview = welcomeManager.formatWelcomeText(text, message.author, message.guild);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ✉️ Join DM Saved & Enabled\n` +
        `-# *New members will receive a private DM on join.*\n\n` +
        `> - **Template:** \`${text}\` \n\n` +
        `> **Preview:** \`${preview}\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
