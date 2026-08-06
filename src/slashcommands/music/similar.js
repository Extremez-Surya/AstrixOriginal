const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  name: "similar",
  description: "Find and queue tracks similar to the currently playing song.",

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player || !player.queue.current) {
      return interaction.reply({ content: "❌ There is no track currently playing.", flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply().catch(() => null);

    const currentTrack = player.queue.current;
    const cleanAuthor = (author) => (author || "").replace(/\s*-\s*Topic\s*$/i, "").trim();
    const query = `${currentTrack.title} ${cleanAuthor(currentTrack.author)}`;

    const res = await client.manager.search(query, {
      engine: "ytmsearch",
      requester: interaction.user,
    });

    if (!res || !res.tracks.length) {
      return interaction.editReply({ content: "❌ Could not find similar tracks." });
    }

    const tracksToAdd = res.tracks.filter((t) => t.uri !== currentTrack.uri).slice(0, 5);

    if (tracksToAdd.length === 0) {
      return interaction.editReply({ content: "❌ No additional unique recommendations found." });
    }

    for (const t of tracksToAdd) {
      player.queue.add(t);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🎶 Added ${tracksToAdd.length} Recommended Similar Songs\n` +
          `> - **Based On:** [${currentTrack.title}](${currentTrack.uri})\n\n` +
          tracksToAdd.map((t, i) => `**${i + 1}.** [${t.title}](${t.uri})`).join("\n")
      )
    );

    return interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
