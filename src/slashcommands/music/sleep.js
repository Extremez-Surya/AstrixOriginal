const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
  ApplicationCommandOptionType,
} = require("discord.js");

const sleepTimers = new Map();

module.exports = {
  name: "sleep",
  description: "Set a sleep timer to automatically stop music after a set duration.",
  options: [
    {
      name: "minutes",
      description: "Duration in minutes before stopping music (or 0/off to cancel)",
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
  ],

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "❌ **There is no active music player running in this server.**"
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const minutes = interaction.options.getNumber("minutes");

    if (minutes <= 0) {
      if (sleepTimers.has(interaction.guild.id)) {
        clearTimeout(sleepTimers.get(interaction.guild.id));
        sleepTimers.delete(interaction.guild.id);

        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent("⏰ **Sleep timer has been cancelled.**")
        );
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      } else {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent("⚠️ **No active sleep timer set for this server.**")
        );
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
    }

    if (minutes > 720) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "⚠️ **Please provide a duration up to 12 hours (720 minutes).**"
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    if (sleepTimers.has(interaction.guild.id)) {
      clearTimeout(sleepTimers.get(interaction.guild.id));
    }

    const ms = minutes * 60 * 1000;
    const timer = setTimeout(async () => {
      const activePlayer = client.manager.players.get(interaction.guild.id);
      if (activePlayer) {
        await activePlayer.destroy().catch(() => null);
        const channel = interaction.guild.channels.cache.get(activePlayer.textId || interaction.channel.id);
        if (channel) {
          const alertContainer = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              "⏰ **Sleep timer expired.** Music playback stopped and disconnected."
            )
          );
          channel.send({ components: [alertContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
        }
      }
      sleepTimers.delete(interaction.guild.id);
    }, ms);

    sleepTimers.set(interaction.guild.id, timer);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `⏰ **Sleep Timer Enabled**\n` +
          `-# *Music will automatically stop and disconnect in **${minutes} minute(s)**.*`
      )
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
