const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { updateNowPlayingMessage } = require("../../lib/musicManager.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["seek"],
  category: "Music",
  desc: "Seek to a specific timestamp in the current track (e.g. .seek 1:30 or .seek 90).",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const player = client.manager.players.get(message.guild.id);
    if (!player || !player.queue.current) {
      return message.reply({
        content: "❌ There is no track currently playing.",
      });
    }

    const input = args[0];
    if (!input) {
      return message.reply({
        content:
          "⚠️ Please specify a target timestamp (e.g. `.seek 1:30` or `.seek 90`).",
      });
    }

    let seconds = 0;
    if (input.includes(":")) {
      const parts = input.split(":").map(Number);
      if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
      else if (parts.length === 3)
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else {
      seconds = parseInt(input, 10);
    }

    if (isNaN(seconds) || seconds < 0) {
      return message.reply({ content: "❌ Invalid timestamp format." });
    }

    const targetMs = seconds * 1000;
    if (targetMs > player.queue.current.length) {
      return message.reply({ content: "⚠️ Timestamp exceeds track duration." });
    }

    await player.seek(targetMs);
    await updateNowPlayingMessage(client, player);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ⏩ Playback Seeked\n` + `> - **Jumped To:** \`${input}\``,
      ),
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
