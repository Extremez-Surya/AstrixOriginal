const fs = require("fs");
const path = require("path");
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
} = require("discord.js");

const DATA_FILE = path.join(__dirname, "pollData.json");

const pollCache = new Map();
let isInitialized = false;

function initCache() {
  if (isInitialized) return;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed.polls) {
        for (const [msgId, data] of Object.entries(parsed.polls)) {
          pollCache.set(msgId, {
            messageId: msgId,
            guildId: data.guildId,
            channelId: data.channelId,
            question: data.question,
            options: (data.options || []).map((o, idx) => ({
              index: idx,
              label: o.label,
              votes: new Set(o.votes || []),
            })),
            authorId: data.authorId,
            allowMulti: Boolean(data.allowMulti),
            closed: Boolean(data.closed),
            createdAt: data.createdAt || Date.now(),
          });
        }
      }
    }
  } catch (e) {
    console.error("[PollManager] Cache init error:", e);
  }
  isInitialized = true;
}

function saveDisk() {
  try {
    const obj = { polls: {} };
    for (const [msgId, data] of pollCache.entries()) {
      if (data) {
        obj.polls[msgId] = {
          guildId: data.guildId,
          channelId: data.channelId,
          question: data.question,
          options: data.options.map((o) => ({
            label: o.label,
            votes: Array.from(o.votes),
          })),
          authorId: data.authorId,
          allowMulti: data.allowMulti,
          closed: data.closed,
          createdAt: data.createdAt,
        };
      }
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), "utf8");
  } catch (e) {
    console.error("[PollManager] Save error:", e);
  }
}

function getGuildPolls(guildId) {
  if (!isInitialized) initCache();
  const list = [];
  for (const [, poll] of pollCache.entries()) {
    if (poll.guildId === guildId) list.push(poll);
  }
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

function getPoll(messageId) {
  if (!isInitialized) initCache();
  return pollCache.get(messageId) || null;
}

function createCustomPoll(messageId, guildId, channelId, question, optionsList, authorId, allowMulti = false) {
  if (!isInitialized) initCache();

  const poll = {
    messageId,
    guildId,
    channelId,
    question: question.trim(),
    options: optionsList.slice(0, 25).map((opt, idx) => ({
      index: idx,
      label: opt.trim(),
      votes: new Set(),
    })),
    authorId,
    allowMulti: Boolean(allowMulti),
    closed: false,
    createdAt: Date.now(),
  };

  pollCache.set(messageId, poll);
  saveDisk();
  return poll;
}

function closePoll(messageId) {
  const poll = getPoll(messageId);
  if (poll) {
    poll.closed = true;
    saveDisk();
    return true;
  }
  return false;
}

function deletePoll(messageId) {
  if (!isInitialized) initCache();
  if (pollCache.has(messageId)) {
    pollCache.delete(messageId);
    saveDisk();
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CLEAN POLL CARD (DISPLAYED IN CHANNELS)
// ─────────────────────────────────────────────────────────────────────────────
function buildPollContainer(poll) {
  const container = new ContainerBuilder();
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.size, 0);

  const statusStr = poll.closed ? "• 🔴 `CLOSED`" : "";
  const header =
    `### 📊 **${poll.question}**\n` +
    `-# Poll by <@${poll.authorId}> • Total Votes: **${totalVotes}** ${statusStr}`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(header));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const optionLines = poll.options.map((opt, idx) => {
    const count = opt.votes.size;
    const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    return `> • **${idx + 1}.** ${opt.label} — **${pct}%** \`(${count} votes)\``;
  });

  let footerText = poll.closed
    ? "-# 🔒 This poll is closed. Final voting results are displayed above."
    : poll.allowMulti
    ? "-# ☑️ *Multi-select poll.* Select one or more options from the menu below."
    : "-# 🗳️ Select your choice from the dropdown menu below to vote or change vote.";

  const body = optionLines.join("\n") + `\n\n${footerText}`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(body));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Community Poll Engine`));

  return container;
}

function buildPollDropdownMenu(poll) {
  if (poll.closed) return null;

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("poll_custom_vote_select")
    .setPlaceholder("🗳️ Select an option to vote or change choice...")
    .addOptions(
      poll.options.map((opt, idx) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(`${idx + 1}. ${opt.label.slice(0, 45)} (${opt.votes.size} votes)`)
          .setValue(`vote_${opt.index}`)
          .setDescription(`Vote for option #${idx + 1}`)
          .setEmoji("🔘")
      )
    );

  // Retract option
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel("Remove / Retract My Vote")
      .setValue("vote_remove")
      .setDescription("Remove your current vote from this poll")
      .setEmoji("❌")
  );

  return new ActionRowBuilder().addComponents(selectMenu);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. DEDICATED POLL STUDIO HUB (WHEN RUNNING .poll)
// ─────────────────────────────────────────────────────────────────────────────
function buildPollStudioHome(guild) {
  const container = new ContainerBuilder();
  const guildPolls = getGuildPolls(guild.id);
  const activePolls = guildPolls.filter((p) => !p.closed);

  const header =
    `### 📊 **Community Poll Studio**\n` +
    `-# Create, customize, and manage real-time community polls for **${guild.name}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(header));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const body =
    `> **Active Polls:** \`${activePolls.length}\` ongoing • **Total Polls Created:** \`${guildPolls.length}\`\n\n` +
    `**⚡ Quick Creation Commands:**\n` +
    `> • \`.poll "Question" "Option 1" "Option 2" ...\` — Multi-option poll\n` +
    `> • \`.poll Question | Option 1 | Option 2 | Option 3\` — Pipe format\n` +
    `> • \`.poll Should we host game night?\` — Quick Yes/No poll\n\n` +
    `-# Or use the interactive dropdown below to create or manage polls.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(body));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const actionMenu = new StringSelectMenuBuilder()
    .setCustomId("poll_studio_action_select")
    .setPlaceholder("⚡ Poll Studio Actions...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Create New Poll (Modal Builder)")
        .setValue("action_modal_create")
        .setDescription("Open interactive popup modal to create a poll")
        .setEmoji("📝"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Active Polls List & Manage")
        .setValue("action_list_polls")
        .setDescription("View, close, or delete ongoing polls")
        .setEmoji("📋"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Command Manual & Guide")
        .setValue("action_manual")
        .setDescription("View syntax, multi-select and duration flags")
        .setEmoji("📖")
    );

  const createBtn = new ButtonBuilder()
    .setCustomId("poll_btn_quick_create")
    .setLabel("Create Poll")
    .setEmoji("📝")
    .setStyle(ButtonStyle.Primary);

  const listBtn = new ButtonBuilder()
    .setCustomId("poll_btn_quick_list")
    .setLabel("Active Polls")
    .setEmoji("📋")
    .setStyle(ButtonStyle.Secondary);

  const menuRow = new ActionRowBuilder().addComponents(actionMenu);
  const btnRow = new ActionRowBuilder().addComponents(createBtn, listBtn);

  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Poll Studio`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. POLL STUDIO ACTIVE LIST VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildPollStudioListView(guild) {
  const container = new ContainerBuilder();
  const guildPolls = getGuildPolls(guild.id);

  const header =
    `### 📋 **Poll Studio • Server Polls**\n` +
    `-# All active and concluded polls in **${guild.name}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(header));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  let body = "";
  if (guildPolls.length > 0) {
    const listStr = guildPolls.slice(0, 10).map((p) => {
      const total = p.options.reduce((sum, o) => sum + o.votes.size, 0);
      const statusStr = p.closed ? "🔴 `Closed`" : "🟢 `Active`";
      return `> • 📊 **"${p.question.slice(0, 40)}"**\n>   \`${total} votes\` • ${statusStr} • *ID:* \`${p.messageId}\` (<#${p.channelId}>)`;
    });
    body = `**Polls (${guildPolls.length}):**\n${listStr.join("\n\n")}\n\n-# Select a poll from the menu below to close or delete it.`;
  } else {
    body = "*No polls found in this server.*\n\n-# Run `.poll` and click Create Poll to build your first poll!";
  }

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(body));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  if (guildPolls.length > 0) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("poll_studio_select_manage")
      .setPlaceholder("⚙️ Select a poll to Close or Delete...")
      .addOptions(
        guildPolls.slice(0, 25).map((p) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(`${p.question.slice(0, 45)}`)
            .setValue(`manage_${p.messageId}`)
            .setDescription(`ID: ${p.messageId} | ${p.closed ? "Closed" : "Active"}`)
            .setEmoji(p.closed ? "🔴" : "🟢")
        )
      );
    container.addActionRowComponents(new ActionRowBuilder().addComponents(selectMenu));
  }

  const backBtn = new ButtonBuilder()
    .setCustomId("poll_btn_back_home")
    .setLabel("Back to Studio")
    .setEmoji("📊")
    .setStyle(ButtonStyle.Secondary);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(backBtn));
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Poll Studio`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. POLL STUDIO MANUAL VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildPollStudioManualView() {
  const container = new ContainerBuilder();

  const header =
    `### 📖 **Poll Studio • Command Guide**\n` +
    `-# Full syntax and examples for creating and managing community polls`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(header));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `**📊 Creating Polls**\n` +
    `> • \`.poll\` — Open Poll Studio dashboard\n` +
    `> • \`.poll "Question" "Option 1" "Option 2" ...\` — Multi-option poll\n` +
    `> • \`.poll Question | Option 1 | Option 2 | Option 3\` — Pipe format\n` +
    `> • \`.poll <Question>\` — Quick Yes/No poll\n\n` +
    `**🛠️ Poll Management**\n` +
    `> • \`.poll list\` — View server polls list\n` +
    `> • \`.poll close <MessageID>\` — Close poll & lock results\n` +
    `> • \`.poll delete <MessageID>\` — Delete poll message\n\n` +
    `**⚡ Modifiers**\n` +
    `> • Add \`--multi\` to allow selecting multiple options`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const backBtn = new ButtonBuilder()
    .setCustomId("poll_btn_back_home")
    .setLabel("Back to Studio")
    .setEmoji("📊")
    .setStyle(ButtonStyle.Secondary);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(backBtn));
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Poll Studio`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. INTERACTION ROUTER
// ─────────────────────────────────────────────────────────────────────────────
async function handlePollInteraction(client, interaction) {
  const isMenu = interaction.isStringSelectMenu();
  const isBtn = interaction.isButton();
  const isModal = interaction.isModalSubmit();

  if (!isMenu && !isBtn && !isModal) return false;

  const customId = interaction.customId;
  if (
    !customId.startsWith("poll_") &&
    customId !== "poll_custom_vote_select" &&
    customId !== "poll_studio_action_select" &&
    customId !== "poll_studio_select_manage"
  ) {
    return false;
  }

  if (!interaction.guild) return false;

  // 1. Voting in Channel Dropdown
  if (isMenu && customId === "poll_custom_vote_select") {
    const messageId = interaction.message.id;
    const userId = interaction.user.id;

    let poll = getPoll(messageId);
    if (!poll) {
      await interaction.reply({
        content: "⚠️ This poll is no longer active.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    if (poll.closed) {
      await interaction.reply({
        content: "🔒 This poll has been closed.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    const selectedValue = interaction.values[0];

    if (selectedValue === "vote_remove") {
      let removed = false;
      poll.options.forEach((opt) => {
        if (opt.votes.delete(userId)) removed = true;
      });
      saveDisk();

      const feedback = removed ? "ℹ️ Your vote has been removed." : "⚠️ You haven't voted in this poll yet.";
      await interaction.reply({
        content: feedback,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    } else if (selectedValue.startsWith("vote_")) {
      const optIdx = parseInt(selectedValue.replace("vote_", ""), 10);
      const targetOption = poll.options[optIdx];

      if (!targetOption) {
        await interaction.reply({ content: "❌ Invalid option selected.", flags: MessageFlags.Ephemeral }).catch(() => null);
        return true;
      }

      if (!poll.allowMulti) {
        poll.options.forEach((opt) => opt.votes.delete(userId));
        targetOption.votes.add(userId);
        await interaction.reply({
          content: `✅ You voted for **${targetOption.label}**!`,
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      } else {
        if (targetOption.votes.has(userId)) {
          targetOption.votes.delete(userId);
          await interaction.reply({
            content: `ℹ️ Removed vote for **${targetOption.label}**.`,
            flags: MessageFlags.Ephemeral,
          }).catch(() => null);
        } else {
          targetOption.votes.add(userId);
          await interaction.reply({
            content: `✅ Added vote for **${targetOption.label}**!`,
            flags: MessageFlags.Ephemeral,
          }).catch(() => null);
        }
      }

      saveDisk();
    }

    const updatedContainer = buildPollContainer(poll);
    const menuRow = buildPollDropdownMenu(poll);
    if (menuRow) updatedContainer.addActionRowComponents(menuRow);

    await interaction.message.edit({
      components: [updatedContainer],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);

    return true;
  }

  // 2. Studio Action Select Menu
  if (isMenu && customId === "poll_studio_action_select") {
    const val = interaction.values[0];

    if (val === "action_modal_create") {
      const modal = new ModalBuilder()
        .setCustomId("poll_studio_modal_create")
        .setTitle("Create Community Poll");

      const qInput = new TextInputBuilder()
        .setCustomId("poll_input_question")
        .setLabel("Poll Question / Topic")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("e.g. Which game should we play tonight?")
        .setRequired(true)
        .setMaxLength(256);

      const optsInput = new TextInputBuilder()
        .setCustomId("poll_input_options")
        .setLabel("Answers / Options (1 per line)")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Valorant\nGTA V\nMinecraft\nCS2\nRoblox")
        .setRequired(true)
        .setMaxLength(2000);

      const multiInput = new TextInputBuilder()
        .setCustomId("poll_input_multi")
        .setLabel("Allow Multiple Answers? (yes / no)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Type 'yes' or leave empty for single choice")
        .setRequired(false)
        .setMaxLength(10);

      modal.addComponents(
        new ActionRowBuilder().addComponents(qInput),
        new ActionRowBuilder().addComponents(optsInput),
        new ActionRowBuilder().addComponents(multiInput)
      );

      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (val === "action_list_polls") {
      const listContainer = buildPollStudioListView(interaction.guild);
      await interaction.update({ components: [listContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }

    if (val === "action_manual") {
      const manualContainer = buildPollStudioManualView();
      await interaction.update({ components: [manualContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
  }

  // 3. Quick Buttons in Studio
  if (isBtn && customId === "poll_btn_quick_create") {
    const modal = new ModalBuilder()
      .setCustomId("poll_studio_modal_create")
      .setTitle("Create Community Poll");

    const qInput = new TextInputBuilder()
      .setCustomId("poll_input_question")
      .setLabel("Poll Question / Topic")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("e.g. Which game should we play tonight?")
      .setRequired(true)
      .setMaxLength(256);

    const optsInput = new TextInputBuilder()
      .setCustomId("poll_input_options")
      .setLabel("Answers / Options (1 per line)")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Valorant\nGTA V\nMinecraft\nCS2\nRoblox")
      .setRequired(true)
      .setMaxLength(2000);

    const multiInput = new TextInputBuilder()
      .setCustomId("poll_input_multi")
      .setLabel("Allow Multiple Answers? (yes / no)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Type 'yes' or leave empty for single choice")
      .setRequired(false)
      .setMaxLength(10);

    modal.addComponents(
      new ActionRowBuilder().addComponents(qInput),
      new ActionRowBuilder().addComponents(optsInput),
      new ActionRowBuilder().addComponents(multiInput)
    );

    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  if (isBtn && customId === "poll_btn_quick_list") {
    const listContainer = buildPollStudioListView(interaction.guild);
    await interaction.update({ components: [listContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (isBtn && customId === "poll_btn_back_home") {
    const homeContainer = buildPollStudioHome(interaction.guild);
    await interaction.update({ components: [homeContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 4. Modal Submission for Creating Poll
  if (isModal && customId === "poll_studio_modal_create") {
    const question = interaction.fields.getTextInputValue("poll_input_question")?.trim();
    const rawOptions = interaction.fields.getTextInputValue("poll_input_options");
    const multiVal = interaction.fields.getTextInputValue("poll_input_multi")?.toLowerCase().trim();
    const allowMulti = multiVal === "yes" || multiVal === "true" || multiVal === "on";

    const options = rawOptions
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (!question || options.length < 2) {
      await interaction.reply({
        content: "⚠️ You must provide a question and at least 2 options (1 option per line).",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
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
      allowMulti,
      closed: false,
    };

    const container = buildPollContainer(tempPoll);
    const menuRow = buildPollDropdownMenu(tempPoll);
    if (menuRow) container.addActionRowComponents(menuRow);

    await interaction.reply({
      content: "✅ Poll created successfully!",
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);

    const sentMessage = await interaction.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);

    if (sentMessage) {
      createCustomPoll(
        sentMessage.id,
        interaction.guild.id,
        interaction.channel.id,
        question,
        options,
        interaction.user.id,
        allowMulti
      );
    }
    return true;
  }

  // 5. Select Poll to Manage from List
  if (isMenu && customId === "poll_studio_select_manage") {
    const val = interaction.values[0];
    if (val.startsWith("manage_")) {
      const targetMsgId = val.replace("manage_", "");
      const poll = getPoll(targetMsgId);

      if (!poll) {
        await interaction.reply({ content: "❌ Poll not found.", flags: MessageFlags.Ephemeral }).catch(() => null);
        return true;
      }

      const manageRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`poll_btn_close_${targetMsgId}`)
          .setLabel(poll.closed ? "Poll is Closed" : "Close Poll")
          .setEmoji("🔒")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(poll.closed),
        new ButtonBuilder()
          .setCustomId(`poll_btn_delete_${targetMsgId}`)
          .setLabel("Delete Poll")
          .setEmoji("🗑️")
          .setStyle(ButtonStyle.Danger)
      );

      const total = poll.options.reduce((sum, o) => sum + o.votes.size, 0);
      await interaction.reply({
        content: `### ⚙️ Managing: **"${poll.question}"**\n> • **Channel:** <#${poll.channelId}>\n> • **Total Votes:** \`${total}\`\n> • **Status:** ${poll.closed ? "🔴 `Closed`" : "🟢 `Active`"}`,
        components: [manageRow],
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }
  }

  // 6. Close Poll Button
  if (isBtn && customId.startsWith("poll_btn_close_")) {
    const targetMsgId = customId.replace("poll_btn_close_", "");
    const poll = getPoll(targetMsgId);
    if (!poll) return true;

    closePoll(targetMsgId);

    try {
      const channel = interaction.guild.channels.cache.get(poll.channelId);
      if (channel) {
        const msg = await channel.messages.fetch(targetMsgId).catch(() => null);
        if (msg) {
          const closedContainer = buildPollContainer(poll);
          await msg.edit({ components: [closedContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
        }
      }
    } catch {}

    await interaction.update({
      content: `🔒 Poll **\`${poll.question}\`** has been closed!`,
      components: [],
    }).catch(() => null);
    return true;
  }

  // 7. Delete Poll Button
  if (isBtn && customId.startsWith("poll_btn_delete_")) {
    const targetMsgId = customId.replace("poll_btn_delete_", "");
    const poll = getPoll(targetMsgId);
    if (!poll) return true;

    deletePoll(targetMsgId);

    try {
      const channel = interaction.guild.channels.cache.get(poll.channelId);
      if (channel) {
        const msg = await channel.messages.fetch(targetMsgId).catch(() => null);
        if (msg) await msg.delete().catch(() => null);
      }
    } catch {}

    await interaction.update({
      content: `🗑️ Poll has been deleted.`,
      components: [],
    }).catch(() => null);
    return true;
  }

  return false;
}

initCache();

module.exports = {
  getGuildPolls,
  getPoll,
  createCustomPoll,
  closePoll,
  deletePoll,
  buildPollContainer,
  buildPollDropdownMenu,
  buildPollStudioHome,
  buildPollStudioListView,
  buildPollStudioManualView,
  handlePollInteraction,
};
