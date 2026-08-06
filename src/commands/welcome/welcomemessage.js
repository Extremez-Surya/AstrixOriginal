const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const welcomeManager = require("../../lib/welcomeManager");

module.exports = {
  alias: ["welcomemessage", "setwelcomemsg"],
  category: "Welcome",
  desc: "Set custom welcome message text template or toggle text greeting message on/off.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const text = args.join(" ").trim();
    const lower = text.toLowerCase();

    if (lower === "off" || lower === "disable" || lower === "false") {
      welcomeManager.updateGuildWelcome(message.guild.id, { messageEnabled: false });
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ⚠️ Welcome Text Message Disabled\n` +
          `-# *Text greeting messages are now **DISABLED**.*`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (lower === "on" || lower === "enable" || lower === "true") {
      welcomeManager.updateGuildWelcome(message.guild.id, { messageEnabled: true });
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ✅ Welcome Text Message Enabled\n` +
          `-# *Text greeting messages are now **ENABLED**.*`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (!text) {
      const config = welcomeManager.getGuildWelcome(message.guild.id);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 👋 Welcome Message Customizer\n` +
          `-# *Configure message template for new members.*\n\n` +
          `> - **Status:** \`${config.messageEnabled ? "ENABLED" : "DISABLED"}\`\n` +
          `> - **Usage:** \`.welcomemessage <template>\` | \`.welcomemessage off\` | \`.welcomemessage on\`\n` +
          `> - **Current Template:** \`${config.messageText}\` \n\n` +
          `> **Placeholders:** \`{user}\`, \`{username}\`, \`{tag}\`, \`{server}\`, \`{memberCount}\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    welcomeManager.updateGuildWelcome(message.guild.id, {
      messageText: text,
      messageEnabled: true,
    });

    const previewText = welcomeManager.formatWelcomeText(text, message.author, message.guild);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ✅ Welcome Message Saved\n` +
        `-# *Template updated and text message enabled successfully.*\n\n` +
        `> - **Raw Template:** \`${text}\` \n\n` +
        `> **Live Format Preview:** \n` +
        `> ${previewText}`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
