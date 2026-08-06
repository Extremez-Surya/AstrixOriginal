const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const welcomeManager = require("../../lib/welcomeManager");

module.exports = {
  alias: ["welcomemessage", "setwelcomemsg"],
  category: "Welcome",
  desc: "Set custom welcome message text template with placeholders.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const text = args.join(" ");

    if (!text) {
      const config = welcomeManager.getGuildWelcome(message.guild.id);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 👋 Welcome Message Customizer\n` +
          `-# *Configure message template for new members.*\n\n` +
          `> - **Usage:** \`.welcomemessage <template>\` \n` +
          `> - **Current Template:** \`${config.messageText}\` \n\n` +
          `> **Placeholders:** \`{user}\`, \`{username}\`, \`{tag}\`, \`{server}\`, \`{memberCount}\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    welcomeManager.updateGuildWelcome(message.guild.id, {
      messageText: text,
    });

    const previewText = welcomeManager.formatWelcomeText(text, message.author, message.guild);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ✅ Welcome Message Saved\n` +
        `-# *Template updated successfully.*\n\n` +
        `> - **Raw Template:** \`${text}\` \n\n` +
        `> **Live Format Preview:** \n` +
        `> ${previewText}`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
