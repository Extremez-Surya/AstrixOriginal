const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const { DSP_FILTERS } = require("../../lib/music/playerUtils.js");

module.exports = {
  alias: ["clearfilters", "resetfilters", "filteroff", "off"],
  category: "Filters",
  desc: "Turn off and reset all active audio sound filters.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message) {
    const player = client.manager.players.get(message.guild.id);
    if (!player || !player.queue.current) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent("❌ **There is no active music player running.**")
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    await DSP_FILTERS.clear.apply(player);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent("🧹 **All audio filters have been turned off and reset to default.**")
    );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
