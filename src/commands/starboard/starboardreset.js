const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const { setGuildConfig } = require("../../lib/starboardManager");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["starboardreset", "sbreset", "starreset"],
  category: "Starboard",
  desc: "Reset all Starboard settings and configurations for this server.",

  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const isPermitted =
      message.member?.permissions.has("Administrator") ||
      message.author.id === message.guild.ownerId ||
      client.developer?.includes(message.author.id);

    if (!isPermitted) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Permission Denied\n` +
            `-# *You need Administrator permissions or be the Server Owner to reset Starboard.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const defaultConfig = {
      enabled: false,
      channelId: null,
      emojis: [{ emoji: "⭐", threshold: 3 }],
      selfStar: false,
      color: "#FFD700",
      timestamp: true,
      jumpUrl: true,
      attachments: true,
      ignoredChannels: [],
      ignoredRoles: [],
      ignoredMembers: [],
      starredMessages: [],
    };

    setGuildConfig(message.guild.id, defaultConfig);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🧹 Starboard Configuration Reset\n` +
            `> - **Status:** 🔴 \`Disabled / Reset\`\n` +
            `> - **Starboard Channel:** \`None\`\n` +
            `> - **Default Emojis Restored:** ⭐ (3+ reactions)\n` +
            `-# *Use \`.starboard\` to configure a new Starboard channel.*`,
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# *ASTRIXCODE™ Starboard Engine*`),
      );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });
  },
};
