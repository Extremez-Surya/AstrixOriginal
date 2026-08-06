const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
  ApplicationCommandOptionType,
} = require("discord.js");
const { DSP_FILTERS } = require("../../lib/music/playerUtils.js");

module.exports = {
  name: "bass",
  description: "Enable or disable Bass Boost audio filter.",
  options: [
    {
      name: "state",
      description: "Turn Bass Boost on or off",
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: [
        { name: "Enable (On)", value: "on" },
        { name: "Disable (Off)", value: "off" },
      ],
    },
  ],

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player || !player.queue.current) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "❌ **There is no track currently playing to apply Bass Boost.**"
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const input = interaction.options.getString("state");
    const currentFilter = player.data.get("activeFilter");
    let enable = input ? input === "on" : currentFilter !== "Bass Boost";

    if (enable) {
      await DSP_FILTERS.bassboost.apply(player);
    } else {
      await DSP_FILTERS.off.apply(player);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `🔊 **Bass Boost Filter ${enable ? "Enabled 💥" : "Disabled 🔇"}**`
      )
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
