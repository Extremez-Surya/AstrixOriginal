const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["speed", "tempo"],
  category: "Music",
  desc: "Adjust audio playback speed (0.5x to 2.0x).",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const player = client.manager.players.get(message.guild.id);
    if (!player || !player.queue.current) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "❌ **There is no active music player running.**",
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const speed = parseFloat(args[0]);
    if (isNaN(speed) || speed < 0.5 || speed > 2.0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `⚠️ **Invalid speed multiplier.**\n` +
            `-# *Specify a multiplier between 0.5 and 2.0 (e.g. \`.speed 1.25\` or \`.speed 0.8\`).*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    await player.shoukaku.setTimescale({ speed: speed, pitch: 1.0, rate: 1.0 });
    player.data.set("activeFilter", `${speed}x Speed`);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `⚡ **Playback speed set to \`${speed}x\`**`,
      ),
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
