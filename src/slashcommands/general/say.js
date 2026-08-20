const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  name: "say",
  description: "Make the bot broadcast a message in a channel.",
  category: "General",
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Make the bot broadcast a message in a channel.")
    .addStringOption((opt) =>
      opt
        .setName("message")
        .setDescription("The message text to send.")
        .setRequired(true)
    )
    .addChannelOption((opt) =>
      opt
        .setName("channel")
        .setDescription("The channel to send the message to.")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const messageText = interaction.options.getString("message", true);
    const targetChannel =
      interaction.options.getChannel("channel") || interaction.channel;

    if (!targetChannel.isTextBased()) {
      return interaction.reply({
        content: "❌ Target channel must be a text channel.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const botPerms = targetChannel.permissionsFor(interaction.guild.members.me);
    if (!botPerms.has(PermissionFlagsBits.SendMessages)) {
      return interaction.reply({
        content: `❌ I lack permission to send messages in ${targetChannel}.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    await targetChannel.send({ content: messageText });

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.tick || "✅"} Message Broadcasted\n` +
          `-# *Successfully sent message in ${targetChannel}.*`
      )
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
