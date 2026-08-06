const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  name: "grab",
  description: "Send details of current song directly to your DMs.",

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player || !player.queue.current) {
      return interaction.reply({ content: "❌ There is no track currently playing.", flags: MessageFlags.Ephemeral });
    }

    const track = player.queue.current;
    const dmContainer = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 📂 Saved Track Details\n` +
          `> - **Title:** [${track.title}](${track.uri})\n` +
          `> - **Artist:** \`${track.author || "Unknown"}\`\n` +
          `> - **Source:** \`${track.sourceName || "Web"}\`\n` +
          `> - **Server:** \`${interaction.guild.name}\``
      )
    );

    return interaction.user
      .send({
        components: [dmContainer],
        flags: MessageFlags.IsComponentsV2,
      })
      .then(async () => {
        const successContainer = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 📬 Direct Message Sent\n` +
              `-# *Track details have been sent to your DMs.*`
          )
        );
        return interaction.reply({
          components: [successContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      })
      .catch(() => {
        return interaction.reply({ content: "❌ Could not send DM. Please check your privacy settings.", flags: MessageFlags.Ephemeral });
      });
  },
};
