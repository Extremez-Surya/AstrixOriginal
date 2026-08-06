const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["booster", "boosters", "boostrole"],
  category: "Booster",
  desc: "Configure server booster announcement messages and booster role perks.",
  botPermissions: ["ManageRoles", "SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const action = args[0]?.toLowerCase();
    const channel = message.mentions.channels.first();

    if (action === "channel" || action === "setup") {
      if (!channel) return message.reply("Please mention a channel: `.booster channel #boost-announcements`");

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🚀 Booster Channel Set\n` +
          `-# *Server boosting celebrations will be published in ${channel}.*\n\n` +
          `> - **Channel:** ${channel} (\`${channel.id}\`)`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🚀 Booster System Panel\n` +
        `-# *Reward and celebrate members who boost your server.*\n\n` +
        `> - **Usage:** \`.booster channel #channel\` | \`.booster message <text>\` | \`.booster test\`\n` +
        `> - **Total Boosters:** \`${message.guild.premiumSubscriptionCount || 0}\` (Tier \`${message.guild.premiumTier}\`)`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
