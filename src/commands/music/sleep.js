const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");

const sleepTimers = new Map();

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["sleep", "sleeptimer", "st"],
  category: "Music",
  desc: "Set a sleep timer to automatically stop music after a set duration.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const player = client.manager.players.get(message.guild.id);
    if (!player) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "❌ **There is no active music player running in this server.**",
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const arg = args[0]?.toLowerCase();

    if (arg === "off" || arg === "cancel" || arg === "stop") {
      if (sleepTimers.has(message.guild.id)) {
        clearTimeout(sleepTimers.get(message.guild.id));
        sleepTimers.delete(message.guild.id);

        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            "⏰ **Sleep timer has been cancelled.**",
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      } else {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            "⚠️ **No active sleep timer set for this server.**",
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }
    }

    if (!arg) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ⏰ Sleep Timer Usage\n` +
            `> - **Usage:** \`${client.prefix || "."}sleep <minutes | 15m | 30m | 1h | off>\`\n` +
            `> - **Example:** \`${client.prefix || "."}sleep 30\` (stops music in 30 minutes)`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    let minutes = parseFloat(arg.replace("m", "").replace("min", ""));
    if (arg.endsWith("h")) {
      minutes = parseFloat(arg.replace("h", "")) * 60;
    }

    if (isNaN(minutes) || minutes <= 0 || minutes > 720) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "⚠️ **Please provide a valid duration between 1 minute and 12 hours (720m).**",
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    // Clear existing timer if any
    if (sleepTimers.has(message.guild.id)) {
      clearTimeout(sleepTimers.get(message.guild.id));
    }

    const ms = minutes * 60 * 1000;
    const timer = setTimeout(async () => {
      const activePlayer = client.manager.players.get(message.guild.id);
      if (activePlayer) {
        await activePlayer.destroy().catch(() => null);
        const channel = message.guild.channels.cache.get(activePlayer.textId || message.channel.id);
        if (channel) {
          const alertContainer = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              "⏰ **Sleep timer expired.** Music playback stopped and disconnected.",
            ),
          );
          channel.send({ components: [alertContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
        }
      }
      sleepTimers.delete(message.guild.id);
    }, ms);

    sleepTimers.set(message.guild.id, timer);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `⏰ **Sleep Timer Enabled**\n` +
          `-# *Music will automatically stop and disconnect in **${minutes} minute(s)**.*\n` +
          `-# *Use \`${client.prefix || "."}sleep off\` to cancel anytime.*`,
      ),
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
