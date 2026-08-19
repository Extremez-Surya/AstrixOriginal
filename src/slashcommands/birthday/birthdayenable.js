const {
  ApplicationCommandType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const birthdayManager = require("../../lib/birthdayManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  name: "birthdayenable",
  category: "Birthday",
  description: "Shortcut to enable master Birthday wish automation.",
  type: ApplicationCommandType.ChatInput,
  botPermissions: ["Administrator"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, interaction) {
    if (!interaction.guild) return;

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      const errorContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Access Denied\n` +
            `-# You need **Manage Server** permission to enable Birthday automation.`
        )
      );
      return interaction.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    birthdayManager.enableMaster(interaction.guild.id);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.ticky_red || "✅"} Birthday System Activated\n` +
            `-# Master Birthday wish automation is now **ENABLED**.`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# System active • ASTRIXCODE™ Sub-0.1s Automation`)
      );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);
  },
};
