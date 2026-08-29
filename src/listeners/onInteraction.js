const {
  Events,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const giveawayManager = require("../lib/giveawayManager");
const EMOJIS = require("../lib/emojis");

const {
  handleMusicInteraction,
} = require("../lib/music/handleMusicInteraction");

module.exports = {
  name: "onInteraction",
  event: Events.InteractionCreate,
  once: false,

  async execute(client, interaction) {
    // 🔒 Security Guard: Only the command author (or server admin) can interact with command UI menus
    const { enforceInteractionAuthorGuard } = require("../lib/security/interactionAuthorGuard");
    const blocked = await enforceInteractionAuthorGuard(client, interaction);
    if (blocked) return;

    // Handle Custom Roles Interactions (Dropdown Select Menus)
    const {
      handleCustomRoleInteraction,
    } = require("../lib/customroles/handleCustomRoleInteraction");
    const handledCustomRole = await handleCustomRoleInteraction(
      client,
      interaction,
    );
    if (handledCustomRole) return;

    // Handle Suggestion System Interactions (Upvote & Downvote Buttons & Hub)
    const suggestionManager = require("../lib/suggestionManager");
    const handledSuggestion =
      await suggestionManager.handleSuggestionInteraction(client, interaction);
    if (handledSuggestion) return;

    const {
      handleSuggestionHubInteraction,
    } = require("../lib/general/handleSuggestionHubInteraction");
    const handledSugHub = await handleSuggestionHubInteraction(
      client,
      interaction
    );
    if (handledSugHub) return;

    // Handle Poll Real-time Voting Interactions
    const { handlePollInteraction } = require("../lib/pollManager");
    const handledPoll = await handlePollInteraction(client, interaction);
    if (handledPoll) return;

    // Handle Community Feedback & Bug Reporting Interactions
    const { handleFeedbackInteraction } = require("../lib/feedbackManager");
    const handledFeedback = await handleFeedbackInteraction(client, interaction);
    if (handledFeedback) return;

    // Handle Embed Studio & Interactive Embed Interactions
    const { handleEmbedInteraction } = require("../lib/embedManager");
    const handledEmbed = await handleEmbedInteraction(client, interaction);
    if (handledEmbed) return;

    // Handle Anti-Raid Interactions (Buttons, Control Panels & Confirmation Dialogs)
    const {
      handleAntiRaidInteraction,
    } = require("../lib/security/handleAntiRaidInteraction");
    const handledAntiRaid = await handleAntiRaidInteraction(
      client,
      interaction,
    );
    if (handledAntiRaid) return;

    // Handle Anti-Nuke Interactions (Dropdown Select Menus & Buttons)
    const {
      handleAntiNukeInteraction,
    } = require("../lib/security/handleAntiNukeInteraction");
    const handledAntiNuke = await handleAntiNukeInteraction(
      client,
      interaction,
    );
    if (handledAntiNuke) return;

    // Handle Unified Multi-System Whitelist Interactions
    const {
      handleUnifiedWhitelistInteraction,
    } = require("../lib/security/handleUnifiedWhitelist");
    const handledUnifiedWhitelist = await handleUnifiedWhitelistInteraction(
      client,
      interaction,
    );
    if (handledUnifiedWhitelist) return;

    // Handle AutoMod Interactions (Dropdown Select Menus & Buttons)
    const {
      handleAutomodInteraction,
    } = require("../lib/security/handleAutomodInteraction");
    const handledAutomod = await handleAutomodInteraction(client, interaction);
    if (handledAutomod) return;

    // Handle Birthday System Interactions (Dropdown Select Menus & Buttons)
    const {
      handleBirthdayInteraction,
    } = require("../lib/security/handleBirthdayInteraction");
    const handledBirthday = await handleBirthdayInteraction(
      client,
      interaction,
    );
    if (handledBirthday) return;

    // Handle Birthday Canvas Studio Interactions
    const {
      handleBirthdayCanvasInteraction,
    } = require("../lib/security/handleBirthdayCanvasInteraction");
    const handledBirthdayCanvas = await handleBirthdayCanvasInteraction(
      client,
      interaction,
    );
    if (handledBirthdayCanvas) return;

    // Handle Owner & NoPrefix System Interactions
    const {
      handleOwnerInteraction,
    } = require("../lib/security/handleOwnerInteraction");
    const handledOwner = await handleOwnerInteraction(client, interaction);
    if (handledOwner) return;

    // Handle Nuke System Interactions (Dropdown Select Menus, Buttons & Modals)
    const {
      handleNukeInteraction,
    } = require("../lib/security/handleNukeInteraction");
    const handledNuke = await handleNukeInteraction(client, interaction);
    if (handledNuke) return;

    // Handle Bump Reminder System Interactions (Dropdown Select Menus, Buttons & Modals)
    const {
      handleBumpReminderInteraction,
    } = require("../lib/security/handleBumpReminderInteraction");
    const handledBumpReminder = await handleBumpReminderInteraction(
      client,
      interaction,
    );
    if (handledBumpReminder) return;

    // Handle Configuration System Interactions (Dropdown Select Menus, Buttons & Modals)
    const {
      handleConfigurationInteraction,
    } = require("../lib/security/handleConfigurationInteraction");
    const handledConfig = await handleConfigurationInteraction(
      client,
      interaction,
    );
    if (handledConfig) return;

    // Handle Starboard System Interactions (Dropdown Select Menus, Buttons & Modals)
    const { handleStarboardInteraction } = require("../lib/starboardManager");
    const handledStarboard = await handleStarboardInteraction(
      client,
      interaction,
    );
    if (handledStarboard) return;

    // Handle Goodbye System Interactions (Buttons, Modals & Tests)
    const {
      handleGoodbyeInteraction,
    } = require("../lib/goodbye/handleGoodbyeInteraction");
    const handledGoodbye = await handleGoodbyeInteraction(client, interaction);
    if (handledGoodbye) return;

    // Handle Goodbye Canvas Studio Interactions (Templates, Colors, Shapes, Modals)
    const {
      handleGoodbyeCanvasInteraction,
    } = require("../lib/goodbye/handleGoodbyeCanvasInteraction");
    const handledGoodbyeCanvas = await handleGoodbyeCanvasInteraction(
      client,
      interaction,
    );
    if (handledGoodbyeCanvas) return;

    // Handle Welcome Canvas Studio Interactions (Templates, Colors, Shapes, Modals)
    const {
      handleWelcomeCanvasInteraction,
    } = require("../lib/welcome/handleWelcomeCanvasInteraction");
    const handledWelcomeCanvas = await handleWelcomeCanvasInteraction(
      client,
      interaction,
    );
    if (handledWelcomeCanvas) return;

    // Handle Ticket Setup Wizard Interactions (Step-by-step dropdowns & customization modal)
    const {
      handleTicketSetupWizard,
    } = require("../lib/ticket/handleTicketSetupWizard");
    const handledTicketWizard = await handleTicketSetupWizard(
      client,
      interaction,
    );
    if (handledTicketWizard) return;

    // Handle Ticket System Interactions (Panels, Select Menus, Claim, Close, Transcripts, Modals)
    const {
      handleTicketInteraction,
    } = require("../lib/ticket/handleTicketInteraction");
    const handledTicket = await handleTicketInteraction(client, interaction);
    if (handledTicket) return;

    // Handle J2C Voice Controller Interactions (Buttons & Modals)
    const {
      handleJ2CControlInteraction,
    } = require("../lib/j2c/handleJ2CControlInteraction");
    const handledJ2CControl = await handleJ2CControlInteraction(
      client,
      interaction,
    );
    if (handledJ2CControl) return;

    // Handle Voice System Interactions (Channel Member Directory Buttons)
    const {
      handleVoiceInteraction,
    } = require("../lib/voice/handleVoiceInteraction");
    const handledVoice = await handleVoiceInteraction(client, interaction);
    if (handledVoice) return;

    // Handle Music Interactions (Buttons & Select Menus)
    const handledMusic = await handleMusicInteraction(client, interaction);
    if (handledMusic) return;

    // Handle Giveaway Button Entries
    if (
      interaction.isButton() &&
      interaction.customId.startsWith("giveaway_entry_")
    ) {
      const messageId = interaction.customId.replace("giveaway_entry_", "");
      const res = giveawayManager.toggleEntry(messageId, interaction.user.id);

      if (!res) {
        return interaction
          .reply({
            content: "❌ This giveaway has ended, paused, or no longer exists.",
            flags: MessageFlags.Ephemeral,
          })
          .catch(() => null);
      }

      // Update button label on message
      try {
        const message = interaction.message;
        if (message) {
          const updatedButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`giveaway_entry_${messageId}`)
              .setEmoji("🎉")
              .setLabel(`Enter (${res.totalEntries} Entries)`)
              .setStyle(ButtonStyle.Primary),
          );

          // Update container components
          const container = ContainerBuilder.from(message.components[0]);
          container.components = container.components.map((c) => {
            if (c.type === 1) {
              // ActionRow
              return updatedButton;
            }
            return c;
          });

          await message
            .edit({
              components: [container],
              flags: MessageFlags.IsComponentsV2,
            })
            .catch(() => null);
        }
      } catch (e) {}

      if (res.entered) {
        return interaction
          .reply({
            content: `<:tada2:1539875614440554597> You have successfully **entered** the giveaway! (Total entries: \`${res.totalEntries}\`)`,
            flags: MessageFlags.Ephemeral,
          })
          .catch(() => null);
      } else {
        return interaction
          .reply({
            content: `❌ You have **left** the giveaway. (Total entries: \`${res.totalEntries}\`)`,
            flags: MessageFlags.Ephemeral,
          })
          .catch(() => null);
      }
    }

    if (
      !interaction.isChatInputCommand() &&
      !interaction.isContextMenuCommand() &&
      !interaction.isAutocomplete()
    )
      return;

    if (!interaction.guild) return;
    const Command = client.slashCommands.get(interaction.commandName);

    if (!Command) return;

    if (!client.developer.includes(interaction.user.id)) {
      if (Command.devOnly && !client.developer.includes(interaction.user.id)) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.red_star || "⭐"} Developer Access Restricted\n` +
              `-# *This command can only be executed by authorized developers.*`,
          ),
        );
        return interaction
          .reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          })
          .catch(() => null);
      }

      if (Command.userPermissions && Command.userPermissions.length !== 0) {
        if (!interaction.member.permissions.has(Command.userPermissions)) {
          const perms = Array.isArray(Command.userPermissions)
            ? Command.userPermissions.join(", ")
            : Command.userPermissions;
          const container = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### ${EMOJIS.red_star || "⭐"} Permission Required\n` +
                `-# *Access denied due to missing user permissions.*\n\n` +
                `> - **Required Permission(s):** \`${perms}\``,
            ),
          );
          return interaction
            .reply({
              components: [container],
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            })
            .catch(() => null);
        }
      }
    }

    if (Command.botPermissions && Command.botPermissions.length !== 0) {
      if (
        !interaction.guild.members.me.permissions.has(Command.botPermissions)
      ) {
        const perms = Array.isArray(Command.botPermissions)
          ? Command.botPermissions.join(", ")
          : Command.botPermissions;
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.red_star || "⭐"} Bot Permission Required\n` +
              `-# *Action blocked: Bot lacks required server permissions.*\n\n` +
              `> - **Missing Permission(s):** \`${perms}\``,
          ),
        );
        return interaction
          .reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          })
          .catch(() => null);
      }
    }

    if (interaction.isAutocomplete()) {
      if (typeof Command.autocomplete === "function") {
        await Command.autocomplete(client, interaction).catch(() => null);
      }
      return;
    }

    Command.execute(client, interaction);
  },
};
