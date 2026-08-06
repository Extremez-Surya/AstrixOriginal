const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const { DSP_FILTERS } = require("../../lib/music/playerUtils.js");

module.exports = {
  alias: ["8d", "spatialaudio", "8dspatial"],
  category: "Filters",
  desc: "Toggle 8D Spatial 360° rotating audio filter.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message) {
    const player = client.manager.players.get(message.guild.id);
    if (!player || !player.queue.current) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent("❌ **There is no track currently playing.**")
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    const currentFilter = player.data.get("activeFilter");
    const active = currentFilter === "8D Spatial";

    if (active) {
      await DSP_FILTERS.clear.apply(player);
    } else {
      await DSP_FILTERS["8d"].apply(player);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `🎧 **8D Spatial Audio Filter ${!active ? "Enabled 🌀" : "Disabled 🔇"}**`
      )
    );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
