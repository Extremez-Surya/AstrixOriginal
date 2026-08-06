const { ApplicationCommandType } = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  name: "lockall",
  category: "Moderation",
  description: "Lock all text channels in the server.",
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
      actionName: "Lock All Channels",
      detailsText: "This will lock all text channels in the server, preventing @everyone from sending messages.",
      onConfirm: async () => {
        const channels = guild.channels.cache.filter((c) => c.isTextBased());
        for (const [id, ch] of channels) {
          try {
            await ch.permissionOverwrites.edit(everyoneRole, { SendMessages: false });
          } catch (e) {}
        }
      },
    });
  },
};
