const { MessageFlags, ApplicationCommandOptionType } = require("discord.js");
const { createVolumeContainer } = require("../../commands/music/volume.js");
const { updateNowPlayingMessage } = require("../../lib/musicManager.js");

module.exports = {
  name: "volume",
  description: "Adjust audio playback volume with interactive buttons (0 - 100%).",
  options: [
    {
      name: "level",
      description: "Volume percentage level (0-100)",
      type: ApplicationCommandOptionType.Integer,
      required: false,
      min_value: 0,
      max_value: 100,
    },
  ],

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player) {
      return interaction.reply({
        content: "❌ No music player running in this server.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const volLevel = interaction.options.getInteger("level");
    if (volLevel !== null && !isNaN(volLevel)) {
      const targetVolume = Math.min(Math.max(volLevel, 0), 100);
      await player.setVolume(targetVolume);
      await updateNowPlayingMessage(client, player);
    }

    const container = createVolumeContainer(player.volume);

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
