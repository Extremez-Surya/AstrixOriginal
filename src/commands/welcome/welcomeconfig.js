const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const welcomeManager = require("../../lib/welcomeManager");

module.exports = {
  alias: ["welcomeconfig", "welcomesettings", "welcomestatus"],
  category: "Welcome",
  desc: "View full configuration and status details of the welcome system.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const config = welcomeManager.getGuildWelcome(message.guild.id);
    const channelMention = config.channelId ? `<#${config.channelId}>` : "`Not Configured`";
    const roleMention = config.autoRoleId ? `<@&${config.autoRoleId}>` : "`None`";

    const previewText = welcomeManager.formatWelcomeText(
      config.messageText,
      message.member || message.author,
      message.guild
    );

    const mainContent =
      `# ⚙️ Welcome System Configuration Details\n` +
      `-# *Full overview of active welcome settings for ${message.guild.name}.*\n\n` +
      `### 📌 Status & Channels\n` +
      `> - **Module State:** \`${config.enabled ? "ENABLED 🟢" : "DISABLED 🔴"}\`\n` +
      `> - **Target Channel:** ${channelMention}\n` +
      `> - **Auto-Assign Role:** ${roleMention}\n\n` +
      `### 🖼️ Canvas Image Settings\n` +
      `> - **Canvas Card:** \`${config.canvasEnabled ? "ENABLED" : "DISABLED"}\`\n` +
      `> - **Background URL:** ${config.canvasBgUrl ? `[Custom Image](${config.canvasBgUrl})` : "`Default Dark Gradient`"}\n\n` +
      `### 📩 Join DM Settings\n` +
      `> - **Join DM State:** \`${config.joinDmEnabled ? "ENABLED" : "DISABLED"}\`\n` +
      `> - **DM Message:** \`${config.joinDmText}\`\n\n` +
      `### 💬 Channel Message Template\n` +
      `\`\`\`\n${config.messageText}\n\`\`\`\n` +
      `> **Formatted Live Output Preview:**\n` +
      `> ${previewText}`;

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(mainContent)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
