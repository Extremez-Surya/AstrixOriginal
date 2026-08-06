const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { getLikedTracks } = require("../../lib/music/userLikesManager.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["showliked", "liked", "favourites"],
  category: "Music",
  desc: "Display your personal liked songs list.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message) {
    const tracks = getLikedTracks(message.author.id);

    if (tracks.length === 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "❤️ **You haven't saved any liked tracks yet.**\n-# *Use `.like` while playing a song to save it.*",
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    let content = `### ❤️ Your Liked Songs (${tracks.length})\n`;
    content += tracks
      .slice(0, 15)
      .map(
        (t, idx) => `**${idx + 1}.** [${t.title}](${t.uri}) - \`${t.author}\``,
      )
      .join("\n");

    if (tracks.length > 15) {
      content += `\n\n-# *...and ${tracks.length - 15} more tracks.*`;
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(content),
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
