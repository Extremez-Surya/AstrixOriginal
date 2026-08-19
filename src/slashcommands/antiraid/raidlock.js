const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
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
  name: "raidlock",
  category: "Anti Raid",
  description: "Instantly lock SendMessages permissions across all public text channels in emergency.",
  type: ApplicationCommandType.ChatInput,
  botPermissions: ["ManageChannels", "ManageRoles"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  options: [
    {
      name: "reason",
      description: "Reason for emergency lockdown.",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  async execute(client, interaction) {
    if (!interaction.guild) return;

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Permission Denied\n` +
            `-# You need **Manage Server** permissions to execute server lockdown.`
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const reason = interaction.options.getString("reason") || `Emergency raid lockdown invoked by ${interaction.user.tag}`;

    const textChannels = interaction.guild.channels.cache.filter(
      (c) =>
        c.type === ChannelType.GuildText &&
        c.permissionsFor(interaction.guild.roles.everyone).has(PermissionFlagsBits.SendMessages)
    );

    if (textChannels.size === 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.tick || "ℹ️"} No Lockable Channels\n` +
            `-# All text channels are already locked or missing permission overwrites.`
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    let lockedCount = 0;
    for (const [, channel] of textChannels) {
      await channel.permissionOverwrites
        .edit(
          interaction.guild.roles.everyone,
          { SendMessages: false },
          { reason: `Raid Lock: ${reason}` }
        )
        .then(() => lockedCount++)
        .catch(() => null);
    }

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.Warn_red || "🔒"} SERVER LOCKDOWN EXECUTED\n` +
            `-# *Sending messages disabled for @everyone across text channels.*\n\n` +
            `> - **Channels Locked:** \`${lockedCount}\` text channel(s)\n` +
            `> - **Reason:** \`${reason}\` \n` +
            `> - **Unlock Command:** Run \`/raidunlock\` to restore normal permissions.`
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
