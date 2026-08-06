const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const welcomeManager = require("../../lib/welcomeManager");

module.exports = {
  alias: ["welcomereset", "resetwelcome"],
  category: "Welcome",
  desc: "Reset all welcome system settings to default configuration.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    welcomeManager.resetGuildWelcome(message.guild.id);
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🔄 Welcome Configuration Reset\n` +
        `-# *All welcome parameters have been restored to default values.*\n\n` +
        `> - **Status:** \`DISABLED\`\n` +
        `> - **Channel:** \`None\`\n` +
        `> - **Message:** Reset to default template\n` +
        `> - **Canvas Card:** \`ENABLED (Default BG)\`\n` +
        `> - **Auto-Role:** \`None\`\n` +
        `> - **Join DM:** \`DISABLED\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
