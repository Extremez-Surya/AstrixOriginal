const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  name: "skip",
  description: "Skip the currently playing track.",

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player || !player.queue.current) {
      return interaction.reply({ content: "❌ There is no track currently playing.", flags: MessageFlags.Ephemeral });
    }

    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel || voiceChannel.id !== player.voiceId) {
      return interaction.reply({ content: `❌ You must be in <#${player.voiceId}> to use music commands.`, flags: MessageFlags.Ephemeral });
    }

    const skippedTrack = player.queue.current;
    await player.skip();

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ⏭️ Track Skipped\n` +
          `> - **Skipped:** [${skippedTrack.title}](${skippedTrack.uri})\n` +
          `> - **By:** <@${interaction.user.id}>`
      )
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
