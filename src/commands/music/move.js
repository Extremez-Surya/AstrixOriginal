const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["move", "mv"],
  category: "Music",
  desc: "Move a song from one position to another in the queue.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const player = client.manager.players.get(message.guild.id);
    if (!player || !player.queue.current) {
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

    const fromPos = parseInt(args[0], 10);
    const toPos = parseInt(args[1], 10);

    if (
      isNaN(fromPos) ||
      isNaN(toPos) ||
      fromPos < 1 ||
      toPos < 1 ||
      fromPos > player.queue.length ||
      toPos > player.queue.length
    ) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `⚠️ **Invalid position parameters.**\n` +
            `-# *Usage: \`${client.prefix || "."}move <from_pos> <to_pos>\` (e.g. \`.move 3 1\`)*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const track = player.queue.splice(fromPos - 1, 1)[0];
    player.queue.splice(toPos - 1, 0, track);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `📦 **Moved:** [${track.title}](${track.uri}) from position **#${fromPos}** to **#${toPos}**.`,
      ),
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
