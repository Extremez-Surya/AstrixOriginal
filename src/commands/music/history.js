const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["history", "musichistory", "lastplayed"],
  category: "Music",
  desc: "Display recent playback history for this server.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message) {
    const player = client.manager.players.get(message.guild.id);
    if (!player) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "❌ **There is no active music player running.**",
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const previousTrack = player.data?.get("lastTrack");
    const currentTrack = player.queue.current;

    let content = `### 📜 Server Audio History\n`;

    if (currentTrack) {
      content += `> - **Now Playing:** [${currentTrack.title}](${currentTrack.uri}) - \`${currentTrack.author}\`\n\n`;
    }

    if (previousTrack) {
      content += `> - **Previously Played:** [${previousTrack.title}](${previousTrack.uri}) - \`${previousTrack.author}\``;
    } else {
      content += `-# *No previous tracks recorded in history yet.*`;
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
