const { MessageFlags } = require("discord.js");
const { createNowPlayingContainer, generateMusicCard } = require("../../lib/musicManager.js");

module.exports = {
  name: "nowplaying",
  description: "Display the currently playing song with Canvas Musicard & live interactive controls.",

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player || !player.queue.current) {
      return interaction.reply({
        content: "❌ There is no track currently playing in this server.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply().catch(() => null);

    const cardAttachment = await generateMusicCard(player, player.queue.current);
    const container = await createNowPlayingContainer(client, player, player.queue.current);

    const payload = {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    };

    if (cardAttachment) {
      payload.files = [cardAttachment];
    }

    return interaction.editReply(payload);
  },
};
