const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
const { buildRaidLockContainer } = require("../../lib/security/handleAntiRaidInteraction");
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
    const promises = [];
    for (const [, channel] of textChannels) {
      promises.push(
        channel.permissionOverwrites
          .edit(
            message.guild.roles.everyone,
            { SendMessages: null },
            { reason: `Raid Unlock invoked by ${message.author.tag}` }
          )
          .then(() => unlockedCount++)
          .catch(() => null)
      );
    }
    await Promise.allSettled(promises);

    const container = buildRaidLockContainer({
      isLocked: false,
      count: unlockedCount,
      reason: "Server unlocked",
      executorTag: message.author.tag,
    });

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
