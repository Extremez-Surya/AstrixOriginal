const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");
const suggestionManager = require("../../lib/suggestionManager");

module.exports = {
  name: "suggestthread",
  description: "Create a suggestion discussion thread.",
  category: "General",
  data: new SlashCommandBuilder()
    .setName("suggestthread")
    .setDescription("Create a suggestion discussion thread.")
    .addStringOption((opt) =>
      opt
        .setName("name")
        .setDescription("The title / topic of the thread.")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("content")
        .setDescription("The main suggestion details.")
        .setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const config = suggestionManager.getGuildConfig(interaction.client, guildId);

    if (!config.suggestThreadEnabled || !config.suggestThreadChannelId) {
      return interaction.reply({
        content: "❌ Suggestion threads are not enabled. An administrator must run `.suggestthread channel #channel`.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const channel = interaction.guild.channels.cache.get(config.suggestThreadChannelId);
    if (!channel) {
      return interaction.reply({
        content: "❌ The configured suggestion thread channel no longer exists.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const threadName = interaction.options.getString("name", true);
    const content = interaction.options.getString("content", true);

    try {
      const thread = await channel.threads.create({
        name: threadName.slice(0, 100),
        autoArchiveDuration: 1440,
        reason: `Suggestion thread created by ${interaction.user.tag}`,
      });

      const starterContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# 🧵 Suggestion Thread: ${threadName}\n` +
            `-# *Submitted by <@${interaction.user.id}>*\n\n` +
            `**Suggestion Content:**\n${content}`
        )
      );

      await thread.send({
        components: [starterContainer],
        flags: MessageFlags.IsComponentsV2,
      });

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.tick || "✅"} Suggestion Thread Created\n` +
            `-# *Created thread <#${thread.id}> in ${channel}!*`
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    } catch (err) {
      console.error("Error creating suggestion thread:", err);
      return interaction.reply({
        content: "❌ Failed to create suggestion thread. Please check bot permissions.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
