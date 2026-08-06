const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const { DSP_FILTERS } = require("../../lib/music/playerUtils.js");

module.exports = {
  alias: ["bassboost", "bass", "bb"],
  category: "Filters",
  desc: "Set Bass Boost audio filter level (none, low, medium, high).",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const player = client.manager.players.get(message.guild.id);
    if (!player || !player.queue.current) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent("❌ **There is no track currently playing.**")
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    const input = args[0]?.toLowerCase();

    if (input === "none" || input === "off" || input === "disable") {
      await DSP_FILTERS.clear.apply(player);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent("🔊 **Bass Boost Filter Disabled 🔇**")
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    if (input === "low") {
      await DSP_FILTERS.bassboost_low.apply(player);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent("🔊 **Bass Boost Level set to LOW 🔉**")
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    if (input === "medium" || input === "mid" || input === "on" || input === "enable") {
      await DSP_FILTERS.bassboost_medium.apply(player);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent("🔊 **Bass Boost Level set to MEDIUM 🔊**")
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    if (input === "high" || input === "max") {
      await DSP_FILTERS.bassboost_high.apply(player);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent("🔊 **Bass Boost Level set to HIGH 💥**")
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    // Toggle default
    const current = player.data.get("activeFilter") || "";
    if (current.includes("Bass Boost")) {
      await DSP_FILTERS.clear.apply(player);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent("🔊 **Bass Boost Filter Disabled 🔇**")
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } else {
      await DSP_FILTERS.bassboost_medium.apply(player);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent("🔊 **Bass Boost Filter Enabled (Medium) 💥**")
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
  },
};
