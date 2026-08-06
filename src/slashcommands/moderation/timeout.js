const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  name: "timeout",
  category: "Moderation",
  description: "Timeout a member for a specified duration.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "user",
      description: "The user to timeout.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "duration",
      description: "The duration of the timeout.",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "60 Seconds", value: "60s" },
        { name: "5 Minutes", value: "5m" },
        { name: "10 Minutes", value: "10m" },
        { name: "1 Hour", value: "1h" },
        { name: "1 Day", value: "1d" },
        { name: "1 Week", value: "1w" },
      ],
    },
    {
      name: "reason",
      description: "The reason for the timeout.",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  botPermissions: ["ModerateMembers"],
  userPermissions: ["ModerateMembers"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const targetUser = interaction.options.getUser("user");
    const durationVal = interaction.options.getString("duration");
    const reason = interaction.options.getString("reason") || "No reason provided.";

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      return interaction.editReply("This user is not currently in this server.");
    }

    if (!member.moderatable) {
      return interaction.editReply("I cannot timeout this member (they might have higher roles or permissions).");
    }

    // Parse duration value
    let durationMs = 600000; // default 10m
    const match = durationVal.match(/^(\d+)([smhdw])$/i);
    if (match) {
      const val = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      switch (unit) {
        case 's': durationMs = val * 1000; break;
        case 'm': durationMs = val * 60 * 1000; break;
        case 'h': durationMs = val * 60 * 60 * 1000; break;
        case 'd': durationMs = val * 24 * 60 * 60 * 1000; break;
        case 'w': durationMs = val * 7 * 24 * 60 * 60 * 1000; break;
      }
    }

    await confirmAction({
      client,
      context: interaction,
      moderator: interaction.user,
      targetUser,
      actionName: "Timeout",
      detailsText: `**Duration:** ${durationVal} | **Reason:** ${reason}`,
      onConfirm: async () => {
        await member.timeout(durationMs, reason);
      },
    });
  },
};
