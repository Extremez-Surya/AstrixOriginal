const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const { addLikedTrack } = require("../../lib/music/userLikesManager.js");

module.exports = {
  name: "like",
  description: "Add the current playing track to your personal liked songs list.",

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player || !player.queue.current) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "❌ **There is no track currently playing.**"
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const track = player.queue.current;
    const added = addLikedTrack(interaction.user.id, track);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        added
          ? `❤️ **Added to Favourites:** [${track.title}](${track.uri})`
          : `ℹ️ **Track is already in your favourites!**`
      )
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
