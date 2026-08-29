const {
  SlashCommandBuilder,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const pollManager = require("../../lib/pollManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Interactive community polling suite with dropdown voting & unlimited options")
    // 1. /poll hub
    .addSubcommand((sub) =>
      sub.setName("panel").setDescription("Open the interactive Poll Control Center")
    )
    // 2. /poll list
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("View all active polls in this server")
    )
    // 3. /poll close
    .addSubcommand((sub) =>
      sub
        .setName("close")
        .setDescription("Close an active poll and lock final results")
        .addStringOption((opt) =>
          opt.setName("message_id").setDescription("Message ID of the poll to close").setRequired(true)
        )
    )
    // 4. /poll delete
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Delete a poll permanently")
        .addStringOption((opt) =>
          opt.setName("message_id").setDescription("Message ID of the poll to delete").setRequired(true)
        )
    )
    // 5. /poll create
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Create a new custom community poll")
        .addStringOption((opt) =>
          opt.setName("question").setDescription("Poll question").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("options").setDescription("Options separated by pipe '|' (e.g. Valorant | GTA V | Minecraft)").setRequired(true)
        )
        .addBooleanOption((opt) =>
          opt.setName("multiselect").setDescription("Allow choosing multiple answers").setRequired(false)
        )
    ),

  async execute(client, interaction) {
    if (!interaction.guild) return;

    const sub = interaction.options.getSubcommand();

    if (sub === "panel") {
      const dashboard = pollManager.buildPollHubDashboard(interaction.guild, "overview");
      return interaction.reply({
        components: [dashboard],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    if (sub === "list") {
      const dashboard = pollManager.buildPollHubDashboard(interaction.guild, "list");
      return interaction.reply({
        components: [dashboard],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    if (sub === "close") {
      const messageId = interaction.options.getString("message_id").replace(/\D/g, "");
      const poll = pollManager.getPoll(messageId);

      if (!poll) {
        return interaction.reply({ content: "❌ Poll not found.", flags: MessageFlags.Ephemeral });
      }

      const isAuthor = interaction.user.id === poll.authorId;
      const isAdmin =
        interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) ||
        interaction.member.permissions.has(PermissionFlagsBits.Administrator);

      if (!isAuthor && !isAdmin) {
        return interaction.reply({ content: "❌ Only poll creator or admins can close this poll.", flags: MessageFlags.Ephemeral });
      }

      pollManager.closePoll(messageId);

      try {
        const channel = interaction.guild.channels.cache.get(poll.channelId);
        if (channel) {
          const msg = await channel.messages.fetch(messageId).catch(() => null);
          if (msg) {
            const closedContainer = pollManager.buildPollContainer(poll);
            await msg.edit({ components: [closedContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
          }
        }
      } catch {}

      return interaction.reply({ content: `🔒 Poll **\`${poll.question.slice(0, 40)}\`** has been closed!`, flags: MessageFlags.Ephemeral });
    }

    if (sub === "delete") {
      const messageId = interaction.options.getString("message_id").replace(/\D/g, "");
      const poll = pollManager.getPoll(messageId);

      if (!poll) {
        return interaction.reply({ content: "❌ Poll not found.", flags: MessageFlags.Ephemeral });
      }

      const isAuthor = interaction.user.id === poll.authorId;
      const isAdmin =
        interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) ||
        interaction.member.permissions.has(PermissionFlagsBits.Administrator);

      if (!isAuthor && !isAdmin) {
        return interaction.reply({ content: "❌ Only poll creator or admins can delete this poll.", flags: MessageFlags.Ephemeral });
      }

      pollManager.deletePoll(messageId);

      try {
        const channel = interaction.guild.channels.cache.get(poll.channelId);
        if (channel) {
          const msg = await channel.messages.fetch(messageId).catch(() => null);
          if (msg) await msg.delete().catch(() => null);
        }
      } catch {}

      return interaction.reply({ content: `🗑️ Poll deleted successfully!`, flags: MessageFlags.Ephemeral });
    }

    if (sub === "create") {
      const question = interaction.options.getString("question").trim();
      const rawOptions = interaction.options.getString("options");
      const multi = interaction.options.getBoolean("multiselect") || false;

      const options = rawOptions
        .split("|")
        .map((o) => o.trim())
        .filter(Boolean);

      if (options.length < 2) {
        return interaction.reply({
          content: "⚠️ Please provide at least 2 options separated by pipe `|`.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const tempPoll = {
        messageId: "temp",
        guildId: interaction.guild.id,
        channelId: interaction.channel.id,
        question,
        options: options.slice(0, 25).map((opt, idx) => ({
          index: idx,
          label: opt,
          votes: new Set(),
        })),
        authorId: interaction.user.id,
        allowMulti: multi,
        closed: false,
      };

      const container = pollManager.buildPollContainer(tempPoll);
      const menuRow = pollManager.buildPollDropdownMenu(tempPoll);
      if (menuRow) container.addActionRowComponents(menuRow);

      await interaction.reply({ content: "✅ Poll created!", flags: MessageFlags.Ephemeral }).catch(() => null);

      const sent = await interaction.channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);

      if (sent) {
        pollManager.createCustomPoll(
          sent.id,
          interaction.guild.id,
          interaction.channel.id,
          question,
          options,
          interaction.user.id,
          multi
        );
      }
    }
  },
};
