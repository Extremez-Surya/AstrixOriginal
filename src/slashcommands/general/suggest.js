const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");
const suggestionManager = require("../../lib/suggestionManager");

module.exports = {
  name: "suggest",
  description: "Submit a server suggestion.",
  category: "General",
  data: new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Submit a server suggestion.")
    .addStringOption((opt) =>
      opt
        .setName("title")
        .setDescription("The title of your suggestion.")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("description")
        .setDescription("Detailed description of your suggestion.")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("reason")
        .setDescription("Benefits or reasons for this suggestion.")
        .setRequired(false)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const config = suggestionManager.getGuildConfig(interaction.client, guildId);

    if (!config.suggestChannelId) {
      return interaction.reply({
        content: "❌ Suggestions are not configured yet. An administrator must run `.suggest channel #channel`.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const suggestionChannel = interaction.guild.channels.cache.get(config.suggestChannelId);
    if (!suggestionChannel) {
      return interaction.reply({
        content: "❌ The configured suggestion channel no longer exists.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!config.suggestAllowAllChannels && interaction.channel.id !== suggestionChannel.id) {
      return interaction.reply({
        content: `❌ Suggestions can only be submitted inside ${suggestionChannel}.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const title = interaction.options.getString("title", true);
    const description = interaction.options.getString("description", true);
    const reason = interaction.options.getString("reason") || "N/A";

    const msgIdTemp = `sug_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const suggestionContainer = new ContainerBuilder();
    suggestionContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# 💡 New Suggestion from ${interaction.user.username}\n` +
          `-# *Submitted by <@${interaction.user.id}>*\n\n` +
          `### 📌 ${title}\n\n` +
          `**Description:**\n${description}\n\n` +
          `**Benefits / Reason:**\n${reason}`
      )
    );

    suggestionContainer.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    const upvoteButton = new ButtonBuilder()
      .setCustomId(`suggest_upvote_${msgIdTemp}`)
      .setLabel("0")
      .setEmoji(EMOJIS.upvote || "👍")
      .setStyle(ButtonStyle.Success);

    const downvoteButton = new ButtonBuilder()
      .setCustomId(`suggest_downvote_${msgIdTemp}`)
      .setLabel("0")
      .setEmoji(EMOJIS.downvote || "👎")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(upvoteButton, downvoteButton);
    suggestionContainer.addActionRowComponents(row);

    await suggestionChannel.send({
      components: [suggestionContainer],
      flags: MessageFlags.IsComponentsV2,
    });

    const responseContainer = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.tick || "✅"} Suggestion Submitted\n` +
          `-# *Your suggestion has been posted to ${suggestionChannel}!*`
      )
    );

    return interaction.reply({
      components: [responseContainer],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
