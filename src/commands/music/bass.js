const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { DSP_FILTERS } = require("../../lib/music/playerUtils.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["bass", "bassboost", "bb"],
  category: "Filters",
  desc: "Enable or disable Bass Boost audio filter.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const player = client.manager.players.get(message.guild.id);
    if (!player || !player.queue.current) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "❌ **There is no track currently playing to apply Bass Boost.**",
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const input = args[0]?.toLowerCase();
    const currentFilter = player.data.get("activeFilter");
    let enable = input ? (input === "on" || input === "enable" || input === "true") : (currentFilter !== "Bass Boost");

    if (enable) {
      await DSP_FILTERS.bassboost.apply(player);
    } else {
      await DSP_FILTERS.off.apply(player);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `🔊 **Bass Boost Filter ${enable ? "Enabled 💥" : "Disabled 🔇"}**`,
      ),
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
