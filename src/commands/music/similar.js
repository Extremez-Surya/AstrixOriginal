const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["similar", "related", "recommend", "recommendations"],
  category: "Music",
  desc: "Find and queue tracks similar to the currently playing song.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message) {
    const player = client.manager.players.get(message.guild.id);
    if (!player || !player.queue.current) {
      return message.reply({
        content: "❌ There is no track currently playing.",
      });
    }

    const currentTrack = player.queue.current;
    const cleanAuthor = (author) =>
      (author || "").replace(/\s*-\s*Topic\s*$/i, "").trim();
    const query = `${currentTrack.title} ${cleanAuthor(currentTrack.author)}`;

    const res = await client.manager.search(query, {
      engine: "ytmsearch",
      requester: message.author,
    });

    if (!res || !res.tracks.length) {
      return message.reply({ content: "❌ Could not find similar tracks." });
    }

    // Filter out current playing track
    const tracksToAdd = res.tracks
      .filter((t) => t.uri !== currentTrack.uri)
      .slice(0, 5);

    if (tracksToAdd.length === 0) {
      return message.reply({
        content: "❌ No additional unique recommendations found.",
      });
    }

    for (const t of tracksToAdd) {
      player.queue.add(t);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🎶 Added ${tracksToAdd.length} Recommended Similar Songs\n` +
          `> - **Based On:** [${currentTrack.title}](${currentTrack.uri})\n\n` +
          tracksToAdd
            .map((t, i) => `**${i + 1}.** [${t.title}](${t.uri})`)
            .join("\n"),
      ),
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
