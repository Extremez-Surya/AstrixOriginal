const { ApplicationCommandType } = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  name: "unhideall",
  category: "Moderation",
  description: "Unhide all text channels in the server.",
  type: ApplicationCommandType.ChatInput,

  botPermissions: ["ManageChannels"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const guild = interaction.guild;
    const everyoneRole = guild.roles.everyone;

    await confirmAction({
      client,
      context: interaction,
      moderator: interaction.user,
      targetUser: client.user,
      actionName: "Unhide All Channels",
      detailsText: "This will unhide all text channels in the server, resetting View Channel permissions for @everyone.",
      onConfirm: async () => {
        const channels = guild.channels.cache.filter((c) => c.isTextBased());
        for (const [id, ch] of channels) {
          try {
            await ch.permissionOverwrites.edit(everyoneRole, { ViewChannel: null });
          } catch (e) {}
        }
      },
    });
  },
};
