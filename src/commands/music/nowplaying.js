const { MessageFlags } = require("discord.js");
const {
  createNowPlayingContainer,
  generateMusicCard,
} = require("../../lib/musicManager.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["nowplaying", "np"],
  category: "Music",
  desc: "Display the currently playing song with Canvas Musicard & live interactive controls.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message) {
    const player = client.manager.players.get(message.guild.id);
    if (!player || !player.queue.current) {
      return message.reply({
        content: "❌ There is no track currently playing in this server.",
      });
    }

    const cardAttachment = await generateMusicCard(
      player,
      player.queue.current,
    );
    const container = await createNowPlayingContainer(
      client,
      player,
      player.queue.current,
    );

    const payload = {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    };

    if (cardAttachment) {
      payload.files = [cardAttachment];
    }

    return message.reply(payload);
  },
};
