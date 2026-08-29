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
  ChannelSelectMenuBuilder,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
} = require("discord.js");

const DATA_FILE = path.join(__dirname, "feedbackData.json");

const feedbackCache = new Map();
const submissionsCache = new Map();
let isInitialized = false;

function initCache() {
  if (isInitialized) return;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed.guilds) {
        for (const [guildId, data] of Object.entries(parsed.guilds)) {
          feedbackCache.set(guildId, {
            staffChannelId: data.staffChannelId || data.channelId || null,
            portalChannelId: data.portalChannelId || null,
            portalMessageId: data.portalMessageId || null,
            totalSubmissions: data.totalSubmissions || 0,
          });
        }
      }
      if (parsed.submissions) {
        for (const [subId, subData] of Object.entries(parsed.submissions)) {
          submissionsCache.set(subId, subData);
        }
      }
    }
  } catch (e) {
    console.error("[FeedbackManager] Cache init error:", e);
  }
  isInitialized = true;
}

function saveDisk() {
  try {
    const obj = { guilds: {}, submissions: {} };
    for (const [guildId, data] of feedbackCache.entries()) {
      if (data) obj.guilds[guildId] = data;
    }
    for (const [subId, data] of submissionsCache.entries()) {
      if (data) obj.submissions[subId] = data;
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), "utf8");
  } catch (e) {
    console.error("[FeedbackManager] Save error:", e);
  }
}

function getGuildFeedbackConfig(guildId) {
  if (!isInitialized) initCache();
  return (
    feedbackCache.get(guildId) || {
      staffChannelId: null,
      portalChannelId: null,
      portalMessageId: null,
      totalSubmissions: 0,
    }
  );
}

function updateGuildFeedbackConfig(guildId, updates) {
  if (!isInitialized) initCache();
  const cfg = getGuildFeedbackConfig(guildId);
  Object.assign(cfg, updates);
  feedbackCache.set(guildId, cfg);
  saveDisk();
  return cfg;
}

function createSubmission(guildId, userId, category, topic, details, channelId) {
  if (!isInitialized) initCache();
  const subId = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const submission = {
    id: subId,
    guildId,
    userId,
    category,
    topic,
    details,
    channelId,
    status: "pending",
    staffId: null,
    staffNote: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  submissionsCache.set(subId, submission);

  const cfg = getGuildFeedbackConfig(guildId);
  cfg.totalSubmissions = (cfg.totalSubmissions || 0) + 1;
  feedbackCache.set(guildId, cfg);

  saveDisk();
  return submission;
}

function getSubmission(subId) {
  if (!isInitialized) initCache();
  return submissionsCache.get(subId) || null;
}

function updateSubmission(subId, updates) {
  const sub = getSubmission(subId);
  if (!sub) return null;
  Object.assign(sub, updates, { updatedAt: Date.now() });
  submissionsCache.set(subId, sub);
  saveDisk();
  return sub;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRE-MADE AESTHETIC MESSAGES
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_STAFF_MESSAGES = {
  approve: "✨ Thank you for the wonderful suggestion! Your proposal has been approved and accepted by the server staff team.",
  deny: "ℹ️ Thank you for your feedback. After careful review with the staff team, we have decided not to proceed with this proposal at this time.",
  thank: "💖 Thank you for taking the time to share this helpful feedback and contributing to our community!",
  investigate: "🔍 Our staff and development team are actively investigating and reviewing this report.",
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. ADMIN SETUP PANEL
// ─────────────────────────────────────────────────────────────────────────────
function buildFeedbackAdminPanel(guild) {
  const container = new ContainerBuilder();
  const cfg = getGuildFeedbackConfig(guild.id);

  const staffChan = cfg.staffChannelId ? `<#${cfg.staffChannelId}>` : "*Not Set (Automatic logs)*";
  const portalChan = cfg.portalChannelId ? `<#${cfg.portalChannelId}>` : "*Not Deployed*";

  const header =
    `### ⚙️ **Feedback System • Admin Setup Panel**\n` +
    `-# Configure public submission portal and staff routing for **${guild.name}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(header));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const body =
    `> **📥 Staff Log Channel:** ${staffChan}\n` +
    `> **🚀 Public Portal Channel:** ${portalChan}\n` +
    `> **📊 Total Submissions Received:** \`${cfg.totalSubmissions || 0}\`\n\n` +
    `-# Choose an action below to deploy the user portal or route staff channels.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(body));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const actionSelect = new StringSelectMenuBuilder()
    .setCustomId("fb_admin_action_select")
    .setPlaceholder("⚡ Select Configuration Action...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Deploy User Portal in Channel")
        .setValue("action_deploy_portal")
        .setDescription("Post the clean member submission card in a channel")
        .setEmoji("🚀"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Set Staff Log Destination")
        .setValue("action_set_staff_channel")
        .setDescription("Choose where staff receives submissions with approve/deny buttons")
        .setEmoji("📥"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Reset Feedback Settings")
        .setValue("action_reset")
        .setDescription("Reset all feedback channels to defaults")
        .setEmoji("🗑️")
    );

  const deployBtn = new ButtonBuilder()
    .setCustomId("fb_btn_deploy_here")
    .setLabel("Deploy Portal Here")
    .setEmoji("🚀")
    .setStyle(ButtonStyle.Primary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("fb_btn_admin_refresh")
    .setLabel("Refresh Panel")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(actionSelect));
  container.addActionRowComponents(new ActionRowBuilder().addComponents(deployBtn, refreshBtn));
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Feedback Administration`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CLEAN PUBLIC USER PORTAL CARD (FOR REGULAR USERS)
// ─────────────────────────────────────────────────────────────────────────────
function buildFeedbackUserPortal(guild) {
  const container = new ContainerBuilder();

  const header =
    `### 📬 **${guild.name} • Community Feedback & Bug Portal**\n` +
    `-# Share your suggestions, report technical bugs, or leave feedback for the server staff`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(header));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const body =
    `> • **💡 Have an Idea?** Share suggestions to improve events, channels, or features.\n` +
    `> • **🐛 Found a Bug?** Report glitches or broken permissions so we can fix them.\n` +
    `> • **🛡️ Staff Feedback?** Let us know how the team can assist you better.\n\n` +
    `-# Click the **Submit Feedback** button below or select a category from the dropdown.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(body));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const userSelect = new StringSelectMenuBuilder()
    .setCustomId("fb_user_action_select")
    .setPlaceholder("📂 Select Category / Help & Guides...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("💡 Submit Server Idea / Proposal")
        .setValue("submit_idea")
        .setDescription("Share an idea or proposal for the server")
        .setEmoji("💡"),
      new StringSelectMenuOptionBuilder()
        .setLabel("🐛 Report a Bug or Glitch")
        .setValue("submit_bug")
        .setDescription("Report broken bots, roles, or channel issues")
        .setEmoji("🐛"),
      new StringSelectMenuOptionBuilder()
        .setLabel("🛡️ Staff & Moderation Feedback")
        .setValue("submit_staff")
        .setDescription("Send constructive feedback to the staff team")
        .setEmoji("🛡️"),
      new StringSelectMenuOptionBuilder()
        .setLabel("🤖 Bot Feature Request")
        .setValue("submit_bot")
        .setDescription("Suggest new commands or bot features")
        .setEmoji("🤖"),
      new StringSelectMenuOptionBuilder()
        .setLabel("📖 Submission Guidelines & Rules")
        .setValue("guide_rules")
        .setDescription("Read formatting guidelines and rules")
        .setEmoji("📖"),
      new StringSelectMenuOptionBuilder()
        .setLabel("🔒 Privacy & Staff Review Policy")
        .setValue("guide_privacy")
        .setDescription("Learn how feedback is reviewed and processed")
        .setEmoji("🔒")
    );

  const submitBtn = new ButtonBuilder()
    .setCustomId("fb_user_btn_submit_general")
    .setLabel("Submit Feedback")
    .setEmoji("📬")
    .setStyle(ButtonStyle.Primary);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(userSelect));
  container.addActionRowComponents(new ActionRowBuilder().addComponents(submitBtn));
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Community Portal`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. STAFF REVIEW CARD (WITH PRE-MADE AND CUSTOM ACTION OPTIONS)
// ─────────────────────────────────────────────────────────────────────────────
function buildStaffReviewCard(submission, submitterTag = "Unknown User") {
  const container = new ContainerBuilder();

  let catBadge = "📬 `General Feedback`";
  if (submission.category.includes("idea")) catBadge = "💡 `Server Idea / Proposal`";
  if (submission.category.includes("bug")) catBadge = "🐛 `Bug & Technical Issue`";
  if (submission.category.includes("staff")) catBadge = "🛡️ `Staff Feedback`";
  if (submission.category.includes("bot")) catBadge = "🤖 `Bot Feature Request`";

  let statusBadge = "🟡 `PENDING STAFF REVIEW`";
  if (submission.status === "approved") statusBadge = `🟢 \`ACCEPTED / APPROVED\` by <@${submission.staffId}>`;
  if (submission.status === "denied") statusBadge = `🔴 \`DECLINED / REJECTED\` by <@${submission.staffId}>`;
  if (submission.status === "review") statusBadge = `🔵 \`UNDER INVESTIGATION\` by <@${submission.staffId}>`;
  if (submission.status === "thanked") statusBadge = `💌 \`ACKNOWLEDGED & THANKED\` by <@${submission.staffId}>`;

  const header =
    `### 📬 **Community Submission • ${catBadge}**\n` +
    `-# Submitted by <@${submission.userId}> (\`${submitterTag}\`) in <#${submission.channelId}> • Status: ${statusBadge}`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(header));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  let body =
    `> **📌 Topic:**\n> ${submission.topic}\n\n` +
    `> **📝 Details:**\n> ${submission.details.replace(/\n/g, "\n> ")}`;

  if (submission.staffNote) {
    body += `\n\n> **💬 Staff Response / Note:**\n> "${submission.staffNote}"`;
  }

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(body));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const isResolved = submission.status === "approved" || submission.status === "denied";

  const actionSelect = new StringSelectMenuBuilder()
    .setCustomId(`fb_staff_menu_${submission.id}`)
    .setPlaceholder("⚡ Staff Action (Approve / Deny / Thank / Custom Reply)...")
    .setDisabled(isResolved)
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Approve & Accept (Pre-made / Edit)")
        .setValue("action_approve")
        .setDescription("Accept submission & send aesthetic approval message")
        .setEmoji("✅"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Decline / Deny (Pre-made / Edit)")
        .setValue("action_deny")
        .setDescription("Decline submission with aesthetic rejection notice")
        .setEmoji("❌"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Send Thank You & Appreciation")
        .setValue("action_thank")
        .setDescription("Send pre-made appreciation note to user")
        .setEmoji("💌"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Mark Under Investigation")
        .setValue("action_investigate")
        .setDescription("Mark as in-progress & notify user")
        .setEmoji("🔍"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Custom Direct Reply")
        .setValue("action_reply")
        .setDescription("Write a custom message or inquiry to user DM")
        .setEmoji("💬")
    );

  const approveBtn = new ButtonBuilder()
    .setCustomId(`fb_btn_approve_${submission.id}`)
    .setLabel("Approve")
    .setEmoji("✅")
    .setStyle(ButtonStyle.Success)
    .setDisabled(isResolved);

  const denyBtn = new ButtonBuilder()
    .setCustomId(`fb_btn_deny_${submission.id}`)
    .setLabel("Deny")
    .setEmoji("❌")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(isResolved);

  const replyBtn = new ButtonBuilder()
    .setCustomId(`fb_btn_reply_${submission.id}`)
    .setLabel("Custom Reply")
    .setEmoji("💬")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(isResolved);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(actionSelect));
  container.addActionRowComponents(new ActionRowBuilder().addComponents(approveBtn, denyBtn, replyBtn));
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Staff Management Suite`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. USER DM NOTIFICATION CARD
// ─────────────────────────────────────────────────────────────────────────────
function buildUserDMCard(guildName, submission, actionType, staffUser, customMessage) {
  const container = new ContainerBuilder();

  let title = `### 📬 **Feedback Update from ${guildName}**`;
  let statusText = "🟢 `ACCEPTED & APPROVED`";
  let colorEmoji = "🎉";

  if (actionType === "approve") {
    statusText = "🟢 `ACCEPTED & APPROVED`";
    colorEmoji = "🎉";
  } else if (actionType === "deny") {
    statusText = "🔴 `DECLINED / REJECTED`";
    colorEmoji = "ℹ️";
  } else if (actionType === "thank") {
    statusText = "💌 `ACKNOWLEDGED WITH THANKS`";
    colorEmoji = "💖";
  } else if (actionType === "reply") {
    statusText = "💬 `STAFF RESPONSE`";
    colorEmoji = "📬";
  } else if (actionType === "investigate") {
    statusText = "🔍 `UNDER ACTIVE INVESTIGATION`";
    colorEmoji = "🛠️";
  }

  const header =
    `${title}\n` +
    `-# Your community submission has been reviewed by staff member **${staffUser.tag}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(header));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const body =
    `> **📌 Topic:** ${submission.topic}\n` +
    `> **📊 Status:** ${statusText}\n\n` +
    `> **${colorEmoji} Staff Message / Note:**\n` +
    `> "${customMessage}"\n\n` +
    `-# We appreciate your contribution to improving ${guildName}!`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(body));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Community Feedback Engine`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. PUBLIC CHANNEL FEEDBACK STATUS UPDATE CARD (BROADCASTED IN FEEDBACK CHANNEL)
// ─────────────────────────────────────────────────────────────────────────────
function buildPublicChannelUpdateCard(guildName, submission, actionType, staffUser, customMessage) {
  const container = new ContainerBuilder();

  let catBadge = "📬 `General Feedback`";
  if (submission.category.includes("idea")) catBadge = "💡 `Server Idea / Proposal`";
  if (submission.category.includes("bug")) catBadge = "🐛 `Bug & Technical Issue`";
  if (submission.category.includes("staff")) catBadge = "🛡️ `Staff Feedback`";
  if (submission.category.includes("bot")) catBadge = "🤖 `Bot Feature Request`";

  let statusBadge = "🟢 `ACCEPTED & APPROVED`";
  let statusEmoji = "🎉";

  if (actionType === "approve") {
    statusBadge = "🟢 `ACCEPTED & APPROVED`";
    statusEmoji = "🎉";
  } else if (actionType === "deny") {
    statusBadge = "🔴 `DECLINED`";
    statusEmoji = "ℹ️";
  } else if (actionType === "thank") {
    statusBadge = "💌 `ACKNOWLEDGED & THANKED`";
    statusEmoji = "💖";
  } else if (actionType === "reply") {
    statusBadge = "💬 `STAFF RESPONDED`";
    statusEmoji = "📬";
  } else if (actionType === "investigate") {
    statusBadge = "🔍 `UNDER INVESTIGATION`";
    statusEmoji = "🛠️";
  }

  const header =
    `### ${statusEmoji} **Feedback Review Update • ${catBadge}**\n` +
    `-# Feedback by <@${submission.userId}> has been reviewed by staff <@${staffUser.id}>`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(header));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const body =
    `> **📌 Topic:** ${submission.topic}\n` +
    `> **📊 Resolution Status:** ${statusBadge}\n\n` +
    `> **💬 Staff Note:**\n` +
    `> "${customMessage}"`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(body));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Community Review Notice`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. MODAL BUILDERS
// ─────────────────────────────────────────────────────────────────────────────
function createFeedbackModal(category = "general") {
  let title = "Submit Feedback";
  let topicLabel = "Feedback Topic / Summary";
  let detailLabel = "Detailed Information";

  if (category === "submit_idea" || category === "cat_idea") {
    title = "Submit Server Idea";
    topicLabel = "Idea Title / Proposal";
    detailLabel = "Describe your idea & benefits";
  } else if (category === "submit_bug" || category === "cat_bug") {
    title = "Report a Bug / Issue";
    topicLabel = "Bug Summary";
    detailLabel = "Steps to reproduce & what went wrong";
  } else if (category === "submit_staff" || category === "cat_staff") {
    title = "Staff / Server Feedback";
    topicLabel = "Subject";
    detailLabel = "Constructive feedback comments";
  } else if (category === "submit_bot" || category === "cat_bot") {
    title = "Bot Feature Request";
    topicLabel = "Feature Name";
    detailLabel = "Command or feature description";
  }

  const modal = new ModalBuilder()
    .setCustomId(`fb_modal_submit_${category}`)
    .setTitle(title.slice(0, 45));

  const topicInput = new TextInputBuilder()
    .setCustomId("fb_input_topic")
    .setLabel(topicLabel)
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("e.g. Add custom role rewards for chat levels")
    .setRequired(true)
    .setMaxLength(256);

  const detailInput = new TextInputBuilder()
    .setCustomId("fb_input_details")
    .setLabel(detailLabel)
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("Please write clear, respectful, and detailed info...")
    .setRequired(true)
    .setMaxLength(3000);

  modal.addComponents(
    new ActionRowBuilder().addComponents(topicInput),
    new ActionRowBuilder().addComponents(detailInput)
  );

  return modal;
}

function createStaffActionModal(subId, actionType) {
  let title = "Staff Action";
  let label = "Staff Note / Message to User";
  let defaultVal = DEFAULT_STAFF_MESSAGES[actionType] || "";

  if (actionType === "approve") {
    title = "Approve & Accept Feedback";
    label = "Acceptance Note (Pre-made / Customizable)";
  } else if (actionType === "deny") {
    title = "Decline Feedback";
    label = "Decline Reason (Pre-made / Customizable)";
  } else if (actionType === "thank") {
    title = "Send Thank You Note";
    label = "Appreciation Message";
  } else if (actionType === "reply") {
    title = "Custom Message to User";
    label = "Custom Message Body";
    defaultVal = "";
  } else if (actionType === "investigate") {
    title = "Mark Under Review";
    label = "Investigation Update Message";
  }

  const modal = new ModalBuilder()
    .setCustomId(`fb_staff_action_modal_${subId}_${actionType}`)
    .setTitle(title.slice(0, 45));

  const msgInput = new TextInputBuilder()
    .setCustomId("staff_input_message")
    .setLabel(label)
    .setStyle(TextInputStyle.Paragraph)
    .setValue(defaultVal)
    .setRequired(true)
    .setMaxLength(2000);

  modal.addComponents(new ActionRowBuilder().addComponents(msgInput));
  return modal;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. CENTRAL INTERACTION ROUTER
// ─────────────────────────────────────────────────────────────────────────────
async function handleFeedbackInteraction(client, interaction) {
  const isMenu = interaction.isStringSelectMenu();
  const isBtn = interaction.isButton();
  const isChanMenu = interaction.isChannelSelectMenu();
  const isModal = interaction.isModalSubmit();

  if (!isMenu && !isBtn && !isChanMenu && !isModal) return false;

  const customId = interaction.customId;
  if (!customId.startsWith("fb_") && !customId.startsWith("feedback_")) return false;

  if (!interaction.guild) return false;
  const guildId = interaction.guild.id;

  // ───────────────────────────────────────────────────────────────────────────
  // A. PUBLIC USER PORTAL INTERACTIONS
  // ───────────────────────────────────────────────────────────────────────────
  if (isBtn && customId === "fb_user_btn_submit_general") {
    const modal = createFeedbackModal("general");
    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  if (isMenu && customId === "fb_user_action_select") {
    const val = interaction.values[0];

    if (val.startsWith("submit_")) {
      const modal = createFeedbackModal(val);
      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (val === "guide_rules") {
      await interaction.reply({
        content:
          `### 📖 **Feedback Guidelines & Rules**\n` +
          `> • **Be Constructive:** Explain *why* your suggestion or feedback helps the community.\n` +
          `> • **No Spam / Trolling:** Disrespectful submissions will be ignored and may result in a mute.\n` +
          `> • **Check Existing:** Make sure your idea or bug has not already been submitted.\n\n` +
          `-# Click **Submit Feedback** when you are ready to post!`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    if (val === "guide_privacy") {
      await interaction.reply({
        content:
          `### 🔒 **Privacy & Staff Review Policy**\n` +
          `> • **Who sees this:** Only server staff and administrators review feedback submissions.\n` +
          `> • **Response:** You will receive a direct DM notification and channel notice once staff reviews your feedback!\n\n` +
          `-# Thank you for contributing to ${interaction.guild.name}!`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }
  }

  // User Submits Modal -> Route to Staff Channel with Review Card
  if (isModal && customId.startsWith("fb_modal_submit_")) {
    const category = customId.replace("fb_modal_submit_", "");
    const topic = interaction.fields.getTextInputValue("fb_input_topic")?.trim();
    const details = interaction.fields.getTextInputValue("fb_input_details")?.trim();

    const submission = createSubmission(
      guildId,
      interaction.user.id,
      category,
      topic,
      details,
      interaction.channel.id
    );

    const staffCard = buildStaffReviewCard(submission, interaction.user.tag);

    const cfg = getGuildFeedbackConfig(guildId);
    let targetChannel = null;

    if (cfg.staffChannelId) {
      targetChannel = interaction.guild.channels.cache.get(cfg.staffChannelId);
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
        components: [staffCard],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    await interaction.reply({
      content: `✅ **Thank you!** Your feedback (**${topic}**) has been securely delivered to the staff team for review.`,
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // B. STAFF REVIEW ACTIONS (APPROVE / DENY / THANK / REPLY / INVESTIGATE)
  // ───────────────────────────────────────────────────────────────────────────
  const isStaff =
    interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) ||
    interaction.member.permissions.has(PermissionFlagsBits.ManageGuild) ||
    interaction.member.permissions.has(PermissionFlagsBits.Administrator);

  // 1. Staff Action Select Menu
  if (isMenu && customId.startsWith("fb_staff_menu_")) {
    if (!isStaff) {
      await interaction.reply({ content: "❌ Staff permission required to perform review actions.", flags: MessageFlags.Ephemeral }).catch(() => null);
      return true;
    }

    const subId = customId.replace("fb_staff_menu_", "");
    const actionVal = interaction.values[0].replace("action_", "");

    const modal = createStaffActionModal(subId, actionVal);
    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  // 2. Staff Quick Buttons
  if (isBtn && (customId.startsWith("fb_btn_approve_") || customId.startsWith("fb_btn_deny_") || customId.startsWith("fb_btn_reply_"))) {
    if (!isStaff) {
      await interaction.reply({ content: "❌ Staff permission required.", flags: MessageFlags.Ephemeral }).catch(() => null);
      return true;
    }

    let action = "approve";
    let subId = "";

    if (customId.startsWith("fb_btn_approve_")) {
      action = "approve";
      subId = customId.replace("fb_btn_approve_", "");
    } else if (customId.startsWith("fb_btn_deny_")) {
      action = "deny";
      subId = customId.replace("fb_btn_deny_", "");
    } else if (customId.startsWith("fb_btn_reply_")) {
      action = "reply";
      subId = customId.replace("fb_btn_reply_", "");
    }

    const modal = createStaffActionModal(subId, action);
    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  // 3. Staff Modal Submission Execution
  if (isModal && customId.startsWith("fb_staff_action_modal_")) {
    const parts = customId.replace("fb_staff_action_modal_", "").split("_");
    const subId = parts[0];
    const actionType = parts[1];

    const staffMessage = interaction.fields.getTextInputValue("staff_input_message")?.trim();

    let statusKey = "approved";
    if (actionType === "approve") statusKey = "approved";
    if (actionType === "deny") statusKey = "denied";
    if (actionType === "thank") statusKey = "thanked";
    if (actionType === "investigate") statusKey = "review";
    if (actionType === "reply") statusKey = "review";

    const updatedSub = updateSubmission(subId, {
      status: statusKey,
      staffId: interaction.user.id,
      staffNote: staffMessage,
    });

    if (!updatedSub) {
      await interaction.reply({ content: "❌ Submission record not found.", flags: MessageFlags.Ephemeral }).catch(() => null);
      return true;
    }

    // 1. Send DM to the submitter
    let dmSent = false;
    try {
      const user = await client.users.fetch(updatedSub.userId);
      if (user) {
        const dmCard = buildUserDMCard(
          interaction.guild.name,
          updatedSub,
          actionType,
          interaction.user,
          staffMessage
        );
        await user.send({
          components: [dmCard],
          flags: MessageFlags.IsComponentsV2,
        });
        dmSent = true;
      }
    } catch {
      dmSent = false;
    }

    // 2. Post update card in the Public Feedback Channel
    const cfg = getGuildFeedbackConfig(guildId);
    let publicFeedbackChannel = null;

    if (cfg.portalChannelId) {
      publicFeedbackChannel = interaction.guild.channels.cache.get(cfg.portalChannelId);
    }
    if (!publicFeedbackChannel && updatedSub.channelId) {
      publicFeedbackChannel = interaction.guild.channels.cache.get(updatedSub.channelId);
    }

    if (publicFeedbackChannel && publicFeedbackChannel.isTextBased()) {
      const publicCard = buildPublicChannelUpdateCard(
        interaction.guild.name,
        updatedSub,
        actionType,
        interaction.user,
        staffMessage
      );
      await publicFeedbackChannel.send({
        components: [publicCard],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    // 3. Update the Staff Card in the staff channel
    let submitterTag = "Community Member";
    try {
      const u = await client.users.fetch(updatedSub.userId);
      if (u) submitterTag = u.tag;
    } catch {}

    const updatedStaffCard = buildStaffReviewCard(updatedSub, submitterTag);

    await interaction.update({
      components: [updatedStaffCard],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);

    const dmFeedback = dmSent ? "Direct DM sent to user." : "*(User has DMs disabled)*";
    await interaction.followUp({
      content: `✅ Action **${actionType.toUpperCase()}** executed! ${dmFeedback} • Public channel update posted.`,
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);

    return true;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // C. ADMIN SETUP PANEL
  // ───────────────────────────────────────────────────────────────────────────
  const isAdmin =
    interaction.member.permissions.has(PermissionFlagsBits.ManageGuild) ||
    interaction.member.permissions.has(PermissionFlagsBits.Administrator);

  if (isMenu && customId === "fb_admin_action_select") {
    if (!isAdmin) {
      await interaction.reply({ content: "❌ Administrator permissions required.", flags: MessageFlags.Ephemeral }).catch(() => null);
      return true;
    }

    const val = interaction.values[0];

    if (val === "action_deploy_portal") {
      const userPortal = buildFeedbackUserPortal(interaction.guild);
      await interaction.channel.send({
        components: [userPortal],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);

      updateGuildFeedbackConfig(guildId, { portalChannelId: interaction.channel.id });

      await interaction.reply({
        content: `✅ Clean User Feedback Portal deployed to <#${interaction.channel.id}>!`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    if (val === "action_set_staff_channel") {
      const chanMenu = new ChannelSelectMenuBuilder()
        .setCustomId("fb_admin_select_staff_chan")
        .setPlaceholder("📥 Select channel where staff receives feedback...")
        .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

      await interaction.reply({
        content: "Select the private/staff channel where incoming feedback cards should be sent:",
        components: [new ActionRowBuilder().addComponents(chanMenu)],
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    if (val === "action_reset") {
      updateGuildFeedbackConfig(guildId, { staffChannelId: null, portalChannelId: null });
      const updated = buildFeedbackAdminPanel(interaction.guild);
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
  }

  if (isBtn && customId === "fb_btn_deploy_here") {
    if (!isAdmin) {
      await interaction.reply({ content: "❌ Administrator permissions required.", flags: MessageFlags.Ephemeral }).catch(() => null);
      return true;
    }

    const userPortal = buildFeedbackUserPortal(interaction.guild);
    await interaction.channel.send({
      components: [userPortal],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);

    updateGuildFeedbackConfig(guildId, { portalChannelId: interaction.channel.id });

    await interaction.reply({
      content: `✅ Public Feedback Portal posted in <#${interaction.channel.id}>!`,
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  if (isBtn && customId === "fb_btn_admin_refresh") {
    const updated = buildFeedbackAdminPanel(interaction.guild);
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (isChanMenu && customId === "fb_admin_select_staff_chan") {
    const selectedChan = interaction.values[0];
    updateGuildFeedbackConfig(guildId, { staffChannelId: selectedChan });

    await interaction.update({
      content: `✅ Staff log channel set to <#${selectedChan}>!`,
      components: [],
    }).catch(() => null);
    return true;
  }

  return false;
}

initCache();

module.exports = {
  getGuildFeedbackConfig,
  updateGuildFeedbackConfig,
  createSubmission,
  getSubmission,
  updateSubmission,
  buildFeedbackAdminPanel,
  buildFeedbackUserPortal,
  buildStaffReviewCard,
  buildUserDMCard,
  buildPublicChannelUpdateCard,
  handleFeedbackInteraction,
};
