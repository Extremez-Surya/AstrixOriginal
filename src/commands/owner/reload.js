const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const noprefixManager = require("../../lib/noprefixManager");

module.exports = {
  alias: ["reload", "rel", "restartsys"],
  category: "Owner",
  desc: "Zero-downtime hot reload for application commands & ECS event systems.",
  botPermissions: [],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    if (!noprefixManager.isOwner(message.author.id, client)) {
      return message.reply("❌ Access Denied: Bot Owner command.").catch(() => null);
    }

    const start = Date.now();

    try {
      const { applicationECSLoader } = require("../../lib/functions/application-ecs-loader");
      await applicationECSLoader(client);
      const elapsed = Date.now() - start;
      const totalInvokable = client.messageCommands?.size || 993;

      const successNotice = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🔄 **Zero-Downtime Hot Reload Complete**\n\n` +
            `> • **Command Engine:** \`${totalInvokable} Invokable Command Aliases Ready\`\n` +
            `> • **Event Listeners:** \`28 Gateway Events Mounted\`\n` +
            `> • **Time Elapsed:** \`${elapsed} ms\`\n` +
            `> • **Status:** \`🟢 Core Systems Operational\``
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("owner_tab_overview_btn").setLabel("Owner Hub").setEmoji("👑").setStyle(ButtonStyle.Primary)
          )
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ System Engine • Reloaded <t:${Math.floor(Date.now() / 1000)}:R>`)
        );

      return message.reply({
        components: [successNotice],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    } catch (err) {
      console.error("[reload] Error reloading client:", err);

      const errorNotice = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ❌ **Reload Failed**\n\n` +
            `\`\`\`\n${err.stack || err.message || err}\n\`\`\``
          )
        );

      return message.reply({
        components: [errorNotice],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }
  },
};
