const {
  SlashCommandBuilder,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const feedbackManager = require("../../lib/feedbackManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("feedback")
    .setDescription("Community feedback and bug reporting hub")
    .addSubcommand((sub) =>
      sub.setName("panel").setDescription("Open the interactive feedback hub")
    )
    .addSubcommand((sub) =>
      sub
        .setName("submit")
        .setDescription("Submit feedback or bug report to staff")
        .addStringOption((opt) =>
          opt
            .setName("category")
            .setDescription("Feedback category")
            .setRequired(true)
            .addChoices(
              { name: "💡 General Idea / Suggestion", value: "cat_idea" },
              { name: "🐛 Bug Report", value: "cat_bug" },
              { name: "🛡️ Staff / Server Feedback", value: "cat_staff" },
              { name: "🤖 Bot Feature Request", value: "cat_bot" }
            )
        )
        .addStringOption((opt) =>
          opt.setName("message").setDescription("Your feedback details").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("channel")
        .setDescription("Configure feedback destination channel (Admins)")
        .addChannelOption((opt) =>
          opt.setName("target").setDescription("Staff channel to receive feedback").setRequired(true)
        )
    ),

  async execute(client, interaction) {
    if (!interaction.guild) return;

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === "panel") {
      const hubCard = feedbackManager.buildFeedbackHubCard(interaction.guild, interaction.member);
      return interaction.reply({
        components: [hubCard],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    if (sub === "channel") {
      const isAdmin =
        interaction.member.permissions.has(PermissionFlagsBits.ManageGuild) ||
        interaction.member.permissions.has(PermissionFlagsBits.Administrator);

      if (!isAdmin) {
        return interaction.reply({
          content: "❌ You need **Manage Server** or **Administrator** permission to configure feedback routing.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const chan = interaction.options.getChannel("target");
      feedbackManager.setGuildFeedbackChannel(guildId, chan.id);

      return interaction.reply({
        content: `✅ Feedback destination channel updated to <#${chan.id}>!`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "submit") {
      const cat = interaction.options.getString("category");
      const msg = interaction.options.getString("message");

      feedbackManager.incrementFeedbackCount(guildId);

      let catBadge = "📬 `General Feedback`";
      if (cat === "cat_idea") catBadge = "💡 `Server Idea / Proposal`";
      if (cat === "cat_bug") catBadge = "🐛 `Bug & Issue Report`";
      if (cat === "cat_staff") catBadge = "🛡️ `Staff Feedback`";
      if (cat === "cat_bot") catBadge = "🤖 `Bot Feature Request`";

      const staffCard = feedbackManager.buildFeedbackHubCard; // helper reference or build inline
      const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require("discord.js");
      const staffContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 📬 **New Community Submission • ${catBadge}**\n` +
            `-# Submitted by <@${interaction.user.id}> in <#${interaction.channel.id}>\n\n` +
            `> **Message Content:**\n` +
            `> ${msg.replace(/\n/g, "\n> ")}`
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        )
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Feedback Delivery`));

      const cfg = feedbackManager.getGuildFeedbackConfig(guildId);
      let targetChannel = null;

      if (cfg.channelId) {
        targetChannel = interaction.guild.channels.cache.get(cfg.channelId);
      }

      if (!targetChannel) {
        targetChannel = interaction.guild.channels.cache.find(
          (c) =>
            c.isTextBased() &&
            (c.name.includes("feedback") ||
              c.name.includes("mod-log") ||
              c.name.includes("bot-log") ||
              c.name.includes("staff-chat"))
        );
      }

      if (targetChannel) {
        await targetChannel.send({
          components: [staffContainer],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      return interaction.reply({
        content: `✅ Thank you! Your feedback has been received and routed to the server staff team.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
