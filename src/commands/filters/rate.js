const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["rate", "setrate"],
  category: "Filters",
  desc: "Adjust audio playback rate (0.5x to 2.0x).",

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

    const rate = parseFloat(args[0]);
    if (isNaN(rate) || rate < 0.5 || rate > 2.0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `⚠️ **Invalid rate parameter.**\n` +
            `-# *Specify a rate multiplier between 0.5 and 2.0 (e.g. \`${client.prefix || "."}rate 1.5\`)*`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    await player.shoukaku.setTimescale({ rate: rate, speed: 1.0, pitch: 1.0 });
    player.data.set("activeFilter", `${rate}x Rate`);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`📻 **Playback rate set to \`${rate}x\`**`)
    );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
