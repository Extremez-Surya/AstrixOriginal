const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["logging", "logchannel", "logconfig", "logs"],
  category: "Logging",
  desc: "Configure server audit logging channel for messages, roles, and member updates.",
  botPermissions: ["ViewAuditLog", "SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const channel = message.mentions.channels.first();
    const action = args[0]?.toLowerCase();

    if (action === "setup" || action === "channel") {
      if (!channel) {
        return message.reply("Please mention a valid log channel: `.logging setup #channel`");
      }

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 📜 Log Channel Set\n` +
          `-# *Server events will now be logged in ${channel}.*\n\n` +
          `> - **Channel:** ${channel} (\`${channel.id}\`)`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 📜 Logging Control Panel\n` +
        `-# *Track server events, deleted messages, role changes & audit logs.*\n\n` +
        `> - **Usage:** \`.logging setup #log-channel\` | \`.logging disable\` | \`.logging status\`\n` +
        `> - **Tracked Events:** \`Message Delete/Update, Member Join/Leave, Role Create/Delete, Channel Updates\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
