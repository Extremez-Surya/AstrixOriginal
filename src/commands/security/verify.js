const { ContainerBuilder, TextDisplayBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  alias: ["verify", "verification"],
  category: "Security",
  desc: "Configure server verification panel and verified role assignment.",
  botPermissions: ["ManageRoles", "SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const sub = args[0]?.toLowerCase();

    if (sub === "panel" || sub === "setup") {
      const button = new ButtonBuilder()
        .setCustomId("verify_member_btn")
        .setLabel("Verify Me")
        .setStyle(ButtonStyle.Success)
        .setEmoji("✅");

      const row = new ActionRowBuilder().addComponents(button);

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🔒 Server Verification Required\n` +
            `-# *To gain access to channels, please verify yourself below.*\n\n` +
            `> Click the **Verify Me** button to complete verification.`
          )
        )
        .addActionRowComponents(row);

      await message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return message.reply({ content: "✅ Verification panel deployed successfully.", ephemeral: true }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🔒 Verification Setup\n` +
        `-# *Configure user verification settings.*\n\n` +
        `> - **Usage:** \`.verify panel\` - Send interactive verification panel in current channel\n` +
        `> - **Usage:** \`.verify role @Role\` - Set role given upon verification`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
