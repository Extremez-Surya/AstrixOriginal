const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const welcomeManager = require("../../lib/welcomeManager");
const { renderWelcomeMessage } = require("../../lib/welcome/welcomeBuilder");

module.exports = {
  alias: ["welcometest", "testwelcome"],
  category: "Welcome",
  desc: "Send a live preview test of the active welcome configuration in the current channel.",
  botPermissions: ["SendMessages", "AttachFiles"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const permissions = message.channel.permissionsFor(message.guild.members.me);
    if (!permissions || !permissions.has("SendMessages") || !permissions.has("AttachFiles")) {
      return message.reply("❌ Missing permissions! Bot requires `Send Messages` and `Attach Files` permissions in this channel.").catch(() => null);
    }

    const config = welcomeManager.getGuildWelcome(message.guild.id);

    if (!config.enabled || !config.channelId) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ⚠️ Welcome Greetings Not Active\n` +
          `-# Cannot preview welcome greeting: Module is currently **DISABLED** or channel is not configured.\n\n` +
          `> Use \`.welcome\` to select your channel and enable the module.`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    try {
      const payload = await renderWelcomeMessage(message.member || message.author, config);
      return message.reply(payload).catch((err) => {
        console.error("[WelcomeTest] Error sending reply:", err);
      });
    } catch (err) {
      console.error("[WelcomeTest] Error generating test welcome:", err);
      return message.reply("❌ Failed to render test welcome message: " + err.message).catch(() => null);
    }
  },
};

