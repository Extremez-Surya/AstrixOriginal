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
  alias: ["raidlock", "lockdownserver"],
  category: "Anti Raid",
  desc: "Instantly lock SendMessages permissions across all public text channels in emergency.",
  botPermissions: ["ManageChannels", "ManageRoles"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Permission Denied\n` +
            `-# You need **Manage Server** permissions to execute server lockdown.`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const reason = args.join(" ") || `Emergency raid lockdown invoked by ${message.author.tag}`;

    const textChannels = message.guild.channels.cache.filter(
      (c) =>
        c.type === ChannelType.GuildText &&
        c.permissionsFor(message.guild.roles.everyone).has(PermissionFlagsBits.SendMessages)
    );

    if (textChannels.size === 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.tick || "ℹ️"} No Lockable Channels\n` +
            `-# All text channels are already locked or missing permission overwrites.`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    let lockedCount = 0;
    for (const [, channel] of textChannels) {
      await channel.permissionOverwrites
        .edit(
          message.guild.roles.everyone,
          { SendMessages: false },
          { reason: `Raid Lock: ${reason}` }
        )
        .then(() => lockedCount++)
        .catch(() => null);
    }

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔒 **Server Lockdown Executed**\n` +
            `-# *Sending messages disabled for @everyone across text channels.*\n\n` +
            `> • **Channels Locked:** \`${lockedCount}\` text channel(s)\n` +
            `> • **Reason:** \`${reason}\`\n` +
            `> • **Unlock Command:** Run \`.raidunlock\` to restore normal permissions.`
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
