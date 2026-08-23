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
  alias: ["antinukedisable", "andisable"],
  category: "Anti Nuke",
  desc: "Shortcut to disable master Anti-Nuke server protection.",
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
            `-# Only the **Guild Owner** or designated **Extra Owners** can disable Anti-Nuke.`
        )
      );
      return message.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const { executeAutoCleanup } = require("../../lib/security/handleAutoSetup");

    const loadingContainer = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🛑 **Deactivating Anti-Nuke...**\n` +
            `-# Purging security roles, log channels, category, and resetting configuration.`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );

    const msg = await message.reply({
      components: [loadingContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);

    if (msg) {
      await executeAutoCleanup(message.guild, message.author, msg);
    }
  },
};
