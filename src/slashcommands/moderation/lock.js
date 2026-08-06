const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  name: "lock",
  category: "Moderation",
  description: "Lock the current channel or a specified channel.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "channel",
      description: "The channel to lock.",
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

    const currentOverwrites = channel.permissionOverwrites.cache.get(everyoneRole.id);
    if (currentOverwrites && currentOverwrites.deny.has("SendMessages")) {
      return interaction.editReply(`Channel <#${channel.id}> is already locked.`);
    }

    await confirmAction({
      client,
      context: interaction,
      moderator: interaction.user,
      targetUser: client.user,
      actionName: `Lock Channel`,
      detailsText: `Target Channel: <#${channel.id}> (This will deny Send Messages permission for @everyone)`,
      onConfirm: async () => {
        await channel.permissionOverwrites.edit(everyoneRole, { SendMessages: false });
      },
    });
  },
};
