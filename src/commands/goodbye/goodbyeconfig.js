const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const goodbyeManager = require("../../lib/goodbyeManager");

module.exports = {
  alias: ["goodbyeconfig", "goodbyesettings", "goodbyestatus", "leavesettings", "leavestatus"],
  category: "Goodbye",
  desc: "View full configuration and status details of the goodbye/leave system.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const config = goodbyeManager.getGuildGoodbye(message.guild.id);
    const channelMentions = config.channels && config.channels.length > 0
      ? config.channels.map((c) => `<#${c.channelId}>`).join(", ")
      : "`Not Configured`";

    const sampleDesc = config.channels && config.channels[0]?.description ? config.channels[0].description : "**{user.tag}** has left the server.";
    const previewText = goodbyeManager.formatGoodbyeText(
      sampleDesc,
      message.member || message.author,
      message.guild
    );

    const mainContent =
      `# ⚙️ Goodbye System Configuration Details\n` +
      `-# *Full overview of active leave settings for ${message.guild.name}.*\n\n` +
      `### 📌 Status & Channels\n` +
      `> - **Module State:** \`${config.enabled ? "ENABLED 🟢" : "DISABLED 🔴"}\`\n` +
      `> - **Target Channels:** ${channelMentions}\n` +
      `> - **Total Channels:** \`${config.channels ? config.channels.length : 0} / 5\`\n\n` +
      `### 🖼️ Canvas Image Settings\n` +
      `> - **Canvas Card:** \`${config.channels && config.channels[0]?.canvasEnabled !== false ? "ENABLED" : "DISABLED"}\`\n` +
      `> - **Background URL:** ${config.channels && config.channels[0]?.canvasBgUrl ? `[Custom Image](${config.channels[0].canvasBgUrl})` : "`Default Dark Gradient`"}\n\n` +
      `### 💬 Channel Message Template\n` +
      `\`\`\`\n${sampleDesc}\n\`\`\`\n` +
      `> **Formatted Live Output Preview:**\n` +
      `> ${previewText}`;

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(mainContent)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
