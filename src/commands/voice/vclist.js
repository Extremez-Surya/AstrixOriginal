const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const { generateVCPagePayload } = require("../../lib/voice/handleVoiceInteraction");

module.exports = {
  alias: ["vclist", "voicelist", "vlist"],
  category: "Voice",
  desc: "Browse connected members in your voice channel with state badges and pagination.",
  botPermissions: ["SendMessages"],
  userPermissions: [],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const channel = message.member.voice.channel;
    if (!channel) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ You must be connected to a voice channel to view its member directory.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const payload = generateVCPagePayload(channel, 1);
    return message.reply(payload).catch(() => null);
  },
};
