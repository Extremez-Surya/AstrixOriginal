const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
  ApplicationCommandOptionType,
} = require("discord.js");

module.exports = {
  name: "skipto",
  description: "Skip directly to a specific track position in the server queue.",
  options: [
    {
      name: "position",
      description: "Queue position to skip to",
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
  ],

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player || !player.queue.current) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "❌ **There is no active music player running.**"
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const position = interaction.options.getInteger("position");
    if (position < 1 || position > player.queue.length) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `⚠️ **Invalid queue position.** Please specify a number between 1 and ${player.queue.length}.`
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const targetIndex = position - 1;
    const targetTrack = player.queue[targetIndex];

    if (targetIndex > 0) {
      player.queue.splice(0, targetIndex);
    }
    await player.skip();

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `⏭️ **Skipped to track #${position}:** [${targetTrack.title}](${targetTrack.uri})`
      )
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
