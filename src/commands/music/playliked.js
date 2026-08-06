const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { getLikedTracks } = require("../../lib/music/userLikesManager.js");
const { sendNowPlayingMessage } = require("../../lib/musicManager.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["playliked", "pl"],
  category: "Music",
  desc: "Enqueue all your saved liked tracks into the voice channel.",

  botPermissions: ["SendMessages", "Connect", "Speak"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message) {
    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "❌ **You must be in a voice channel to play your liked songs.**",
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const likedTracks = getLikedTracks(message.author.id);
    if (likedTracks.length === 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "❤️ **You have no saved liked tracks to play.**",
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    let player = client.manager.players.get(message.guild.id);
    if (!player) {
      player = await client.manager.createPlayer({
        guildId: message.guild.id,
        textId: message.channel.id,
        voiceId: voiceChannel.id,
        deaf: true,
      });
    }

    let addedCount = 0;
    for (const trackData of likedTracks) {
      const result = await client.manager.search(trackData.uri, {
        requester: message.author,
      });
      if (result.tracks && result.tracks.length > 0) {
        player.queue.add(result.tracks[0]);
        addedCount++;
      }
    }

    if (!player.playing && !player.paused && player.queue.length > 0) {
      await player.play();
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `❤️ **Enqueued \`${addedCount}\` track(s) from your personal liked songs!**`,
      ),
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
