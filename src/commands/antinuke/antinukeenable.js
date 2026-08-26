const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const antinukeManager = require("../../lib/antinukeManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["antinukeenable", "anenable"],
  category: "Anti Nuke",
  desc: "Shortcut to enable master Anti-Nuke server protection.",
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const isOwner = message.guild.ownerId === message.author.id;
    const config = antinukeManager.getGuildAntinuke(message.guild.id);
    const isExtraOwner = (config.extraOwners || []).includes(message.author.id);
    const isDev = client.developer && Array.isArray(client.developer) && client.developer.includes(message.author.id);

    if (!isOwner && !isExtraOwner && !isDev) {
      const errorContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Access Denied\n` +
            `-# Only the **Guild Owner** or designated **Extra Owners** can enable Anti-Nuke.`
        )
      );
      return message.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    if (config.enabled) {
      const alreadyActiveContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🛡️ **Anti-Nuke Defense Already Active**\n` +
              `> 🟢 Master Anti-Nuke shield and all **10 security modules** are already active and guarding **${message.guild.name}**.\n\n` +
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

      return message.reply({
        components: [alreadyActiveContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const { buildEnableRecommendationContainer } = require("../../lib/security/handleAutoSetup");
    const container = buildEnableRecommendationContainer(message.guild, message.author);

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
