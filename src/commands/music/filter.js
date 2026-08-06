const {
  ContainerBuilder,
  TextDisplayBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
} = require("discord.js");
const { DSP_FILTERS } = require("../../lib/music/playerUtils.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["filter", "filters"],
  category: "Filters",
  desc: "Apply real-time audio DSP sound filters (8D, BassBoost, Nightcore, Vaporwave, etc.).",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message) {
    const player = client.manager.players.get(message.guild.id);
    if (!player || !player.queue.current) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> No Active Track\n` +
            `-# *You need to be playing a track to configure audio filters.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const currentFilter = player.data.get("activeFilter") || "Off";

    const filterOptions = Object.keys(DSP_FILTERS)
      .filter((key) => key !== "clear" && key !== "reverb")
      .slice(0, 25)
      .map((key) => ({
        label: DSP_FILTERS[key].name,
        value: key,
        default: currentFilter.toLowerCase() === DSP_FILTERS[key].name.toLowerCase(),
      }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("music_filter_select")
      .setPlaceholder("Select an Audio Sound Filter")
      .addOptions(filterOptions);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🎛️ Audio DSP Equalizer & Sound Filters\n` +
            `> - **Active Filter:** \`${currentFilter}\`\n\n` +
            `-# *Select a filter from the menu below to update real-time playback sound.*`,
        ),
      )
      .addActionRowComponents(row);

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
