const { MessageFlags, PermissionFlagsBits, ChannelType } = require("discord.js");
const bumpReminderManager = require("../../lib/bumpReminderManager");
const noprefixManager = require("../../lib/noprefixManager");
const { buildBumpReminderContainer } = require("../../lib/security/handleBumpReminderInteraction");

module.exports = {
  name: "bumpreminder",
  description: "Configure automated Disboard /bump reminders, channel locking & bump leaderboard.",
  defaultMemberPermissions: PermissionFlagsBits.ManageChannels,

  async execute(client, interaction) {
    if (!interaction.guild) return;

    const isMemberPermitted = interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels);
    const isBotOwner = noprefixManager.isOwner(interaction.user.id, client);

    if (!isMemberPermitted && !isBotOwner) {
      return interaction.reply({
        content: "❌ Manage Channels permission required to use Bump Reminder commands.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const brContainer = buildBumpReminderContainer(interaction.guild, interaction.user);

    return interaction.reply({
      components: [brContainer],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
