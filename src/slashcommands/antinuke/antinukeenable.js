const {
  ApplicationCommandType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const antinukeManager = require("../../lib/antinukeManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  name: "antinukeenable",
  category: "Anti Nuke",
  description: "Shortcut to enable master Anti-Nuke server protection.",
  type: ApplicationCommandType.ChatInput,
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, interaction) {
    if (!interaction.guild) return;

    const isOwner = interaction.guild.ownerId === interaction.user.id;
    const config = antinukeManager.getGuildAntinuke(interaction.guild.id);
    const isExtraOwner = (config.extraOwners || []).includes(interaction.user.id);
    const isDev = client.developer && Array.isArray(client.developer) && client.developer.includes(interaction.user.id);

    if (!isOwner && !isExtraOwner && !isDev) {
      const errorContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Access Denied\n` +
            `-# Only the **Guild Owner** or designated **Extra Owners** can enable Anti-Nuke.`
        )
      );
      return interaction.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    if (config.enabled) {
      const alreadyActiveContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🛡️ **Anti-Nuke Defense Already Active**\n` +
              `> 🟢 Master Anti-Nuke shield and all **10 security modules** are already active and guarding **${interaction.guild.name}**.\n\n` +
              `-# If you want to reconfigure settings or roles, access the **Control Center** below.`
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );

      const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
      const cpBtn = new ButtonBuilder()
        .setCustomId("antinuke_nav_overview")
        .setLabel("Control Center")
        .setEmoji("🛡️")
        .setStyle(ButtonStyle.Primary);

      const guideBtn = new ButtonBuilder()
        .setCustomId("antinuke_nav_menu")
        .setLabel("Help & Guide")
        .setEmoji("📜")
        .setStyle(ButtonStyle.Secondary);

      alreadyActiveContainer.addActionRowComponents(new ActionRowBuilder().addComponents(cpBtn, guideBtn));
      alreadyActiveContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Active & Enforced`)
      );

      return interaction.reply({
        components: [alreadyActiveContainer],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    const { buildEnableRecommendationContainer } = require("../../lib/security/handleAutoSetup");
    const container = buildEnableRecommendationContainer(interaction.guild, interaction.user);

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);
  },
};
