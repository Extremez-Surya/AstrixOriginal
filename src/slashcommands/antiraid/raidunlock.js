const {
  ApplicationCommandType,
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
  name: "raidunlock",
  category: "Anti Raid",
  description: "Restore SendMessages permissions across server text channels following a raid lockdown.",
  type: ApplicationCommandType.ChatInput,
  botPermissions: ["ManageChannels", "ManageRoles"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, interaction) {
    if (!interaction.guild) return;

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Permission Denied\n` +
            `-# You need **Manage Server** permissions to execute server unlock.`
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const textChannels = interaction.guild.channels.cache.filter(
      (c) => c.type === ChannelType.GuildText
    );

    let unlockedCount = 0;
    for (const [, channel] of textChannels) {
      await channel.permissionOverwrites
        .edit(
          interaction.guild.roles.everyone,
          { SendMessages: null },
          { reason: `Raid Unlock invoked by ${interaction.user.tag}` }
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
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# Executed by ${interaction.user.tag} • ASTRIXCODE™ Emergency Protocol`)
      );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);
  },
};
