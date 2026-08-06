const { ContainerBuilder, TextDisplayBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  alias: ["verifypanel", "verify-panel", "deployverify"],
  category: "Security",
  desc: "Deploy interactive verification panel button in current channel.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
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
  },
};
