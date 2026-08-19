const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["raidunlock", "unlockserver"],
  category: "Anti Raid",
  desc: "Restore SendMessages permissions across server text channels following a raid lockdown.",
  botPermissions: ["ManageChannels", "ManageRoles"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Permission Denied\n` +
            `-# You need **Manage Server** permissions to execute server unlock.`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const textChannels = message.guild.channels.cache.filter(
      (c) => c.type === ChannelType.GuildText
    );

    let unlockedCount = 0;
    for (const [, channel] of textChannels) {
      await channel.permissionOverwrites
        .edit(
          message.guild.roles.everyone,
          { SendMessages: null },
          { reason: `Raid Unlock invoked by ${message.author.tag}` }
        )
        .then(() => unlockedCount++)
        .catch(() => null);
    }

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.ticky_red || "🔓"} SERVER UNLOCK EXECUTED\n` +
            `-# *Sending messages restored for @everyone across text channels.*\n\n` +
            `> - **Channels Unlocked:** \`${unlockedCount}\` text channel(s)\n` +
            `> - **Status:** Server returns to normal channel communication.`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# Executed by ${message.author.tag} • ASTRIXCODE™ Emergency Protocol`
        )
      );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
