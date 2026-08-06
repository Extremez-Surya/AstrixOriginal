const {
  ContainerBuilder,
  TextDisplayBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
} = require("discord.js");
const { DSP_FILTERS } = require("../../lib/music/playerUtils.js");

module.exports = {
  name: "filter",
  description: "Apply real-time audio DSP sound filters (8D, BassBoost, Nightcore, Vaporwave, etc.).",

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player || !player.queue.current) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> No Active Track\n` +
            `-# *You need to be playing a track to configure audio filters.*`
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
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
            `-# *Select a filter from the menu below to update real-time playback sound.*`
        )
      )
      .addActionRowComponents(row);

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
