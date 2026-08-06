const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["grab", "save"],
  category: "Music",
  desc: "Send details of current song directly to your DMs.",

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

    const track = player.queue.current;
    const dmContainer = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 📂 Saved Track Details\n` +
          `> - **Title:** [${track.title}](${track.uri})\n` +
          `> - **Artist:** \`${track.author || "Unknown"}\`\n` +
          `> - **Source:** \`${track.sourceName || "Web"}\`\n` +
          `> - **Server:** \`${message.guild.name}\``,
      ),
    );

    return message.author
      .send({
        components: [dmContainer],
        flags: MessageFlags.IsComponentsV2,
      })
      .then(async () => {
        const successContainer =
          new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### 📬 Direct Message Sent\n` +
                `-# *Track details have been sent to your DMs.*`,
            ),
          );
        return message.reply({
          components: [successContainer],
          flags: MessageFlags.IsComponentsV2,
        });
      })
      .catch(() => {
        return message.reply({
          content: "❌ Could not send DM. Please check your privacy settings.",
        });
      });
  },
};
