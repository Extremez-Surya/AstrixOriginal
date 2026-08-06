const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["skip", "s", "next"],
  category: "Music",
  desc: "Skip the currently playing track.",

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

    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel || voiceChannel.id !== player.voiceId) {
      return message.reply({
        content: `❌ You must be in <#${player.voiceId}> to use music commands.`,
      });
    }

    const skippedTrack = player.queue.current;
    await player.skip();

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ⏭️ Track Skipped\n` +
          `> - **Skipped:** [${skippedTrack.title}](${skippedTrack.uri})\n` +
          `> - **By:** <@${message.author.id}>`,
      ),
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
