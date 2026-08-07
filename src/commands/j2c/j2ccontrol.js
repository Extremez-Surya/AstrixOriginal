const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const j2cManager = require("../../lib/j2cManager");
const { buildJ2CControlPayload } = require("../../lib/j2c/handleJ2CControlInteraction");

module.exports = {
  alias: ["j2ccontrol", "j2cpanel", "voicecontrol", "vcpanel"],
  category: "Join To Create",
  desc: "Send the interactive Voice Channel Control Panel for your temp room.",
  botPermissions: ["SendMessages"],
  userPermissions: [],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const channel = message.member.voice.channel;
    if (!channel) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ You must be connected to a temporary voice channel to use the control panel.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (!j2cManager.isTempChannel(message.guild.id, channel.id)) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ **${channel.name}** is not a Join-To-Create temporary voice channel.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const payload = await buildJ2CControlPayload(message.guild, channel);
    return message.reply(payload).catch(() => null);
  },
};
