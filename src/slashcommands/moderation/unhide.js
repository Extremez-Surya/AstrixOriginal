const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  name: "unhide",
  category: "Moderation",
  description: "Unhide the current channel or a specified channel.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "channel",
      description: "The channel to unhide.",
      type: ApplicationCommandOptionType.Channel,
      required: false,
    },
  ],

  botPermissions: ["ManageChannels"],
  userPermissions: ["ManageChannels"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const channel = interaction.options.getChannel("channel") || interaction.channel;
    const everyoneRole = interaction.guild.roles.everyone;

    await confirmAction({
      client,
      context: interaction,
      moderator: interaction.user,
      targetUser: client.user,
      actionName: `Unhide Channel`,
      detailsText: `Target Channel: <#${channel.id}> (This will reset/allow View Channel permission for @everyone)`,
      onConfirm: async () => {
        await channel.permissionOverwrites.edit(everyoneRole, { ViewChannel: null });
      },
    });
  },
};
