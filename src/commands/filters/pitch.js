const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["pitch", "setpitch"],
  category: "Filters",
  desc: "Adjust audio playback pitch (0.5x to 2.0x).",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const player = client.manager.players.get(message.guild.id);
    if (!player || !player.queue.current) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent("❌ **There is no active music player running.**")
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    const pitch = parseFloat(args[0]);
    if (isNaN(pitch) || pitch < 0.5 || pitch > 2.0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `⚠️ **Invalid pitch parameter.**\n` +
            `-# *Specify a pitch multiplier between 0.5 and 2.0 (e.g. \`${client.prefix || "."}pitch 1.2\`)*`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    await player.shoukaku.setTimescale({ pitch: pitch, speed: 1.0, rate: 1.0 });
    player.data.set("activeFilter", `${pitch}x Pitch`);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`🎵 **Playback pitch set to \`${pitch}x\`**`)
    );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
