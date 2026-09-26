const { MessageFlags, PermissionFlagsBits } = require("discord.js");
const noprefixManager = require("../noprefixManager");

// Custom ID prefixes for interactions that ANY member is allowed to click
const PUBLIC_INTERACTION_PREFIXES = [
  "giveaway_",
  "ticket_create",
  "ticket_open",
  "ticket_panel",
  "ticket_claim",
  "ticket_close",
  "ticket_transcript",
  "suggestion_upvote",
  "suggestion_downvote",
  "customrole_assign",
  "customrole_self",
  "verify_",
  "rules_agree",
  "reaction_role",
  "wlcm_",
  "wcc_",
];

/**
 * Validates if the user clicking the component is authorized (the command invoker, admin, or owner).
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").Interaction} interaction
 * @returns {Promise<boolean>} returns true if BLOCKED (unauthorized), false if ALLOWED.
 */
async function enforceInteractionAuthorGuard(client, interaction) {
  if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isUserSelectMenu() && !interaction.isChannelSelectMenu()) {
    return false;
  }

  const customId = interaction.customId || "";

  // 1. Allow Public Interactions
  for (const prefix of PUBLIC_INTERACTION_PREFIXES) {
    if (customId.startsWith(prefix)) {
      return false; // Allowed for everyone
    }
  }

  // 2. Owner-Only interactions check
  if (customId.startsWith("owner_") || customId.startsWith("np_")) {
    if (!noprefixManager.isOwner(interaction.user.id, client)) {
      await interaction
        .reply({
          content: "❌ Access Denied: Only Bot Owners can interact with this system.",
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return true; // Blocked
    }
    return false; // Allowed for Bot Owner
  }

  // 3. Slash Command Interaction Invoker Check
  const slashInvokerId = interaction.message?.interaction?.user?.id;
  if (slashInvokerId && slashInvokerId !== interaction.user.id) {
    // Allow Administrators to override
    const isAdmin = interaction.member?.permissions?.has(PermissionFlagsBits.Administrator) || interaction.guild?.ownerId === interaction.user.id;
    if (!isAdmin) {
      await interaction
        .reply({
          content: `❌ Only the command author (<@${slashInvokerId}>) can interact with this menu.`,
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return true; // Blocked
    }
  }

  // 4. Prefix Command Reply Reference Check
  const refMessageId = interaction.message?.reference?.messageId;
  if (refMessageId && interaction.channel) {
    try {
      const refMessage =
        interaction.channel.messages.cache.get(refMessageId) ||
        (await interaction.channel.messages.fetch(refMessageId).catch(() => null));

      if (refMessage?.author && refMessage.author.id !== interaction.user.id) {
        // Allow Server Owner or Administrators to override
        const isAdmin =
          interaction.member?.permissions?.has(PermissionFlagsBits.Administrator) ||
          interaction.guild?.ownerId === interaction.user.id ||
          noprefixManager.isOwner(interaction.user.id, client);

        if (!isAdmin) {
          await interaction
            .reply({
              content: `❌ Only the command author (<@${refMessage.author.id}>) can interact with this menu.`,
              flags: MessageFlags.Ephemeral,
            })
            .catch(() => null);
          return true; // Blocked
        }
      }
    } catch (_) {}
  }

  return false; // Allowed
}

module.exports = {
  enforceInteractionAuthorGuard,
  PUBLIC_INTERACTION_PREFIXES,
};
