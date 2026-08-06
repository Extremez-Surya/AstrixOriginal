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

const { handleMusicInteraction } = require("../lib/music/handleMusicInteraction");

module.exports = {
  name: "onInteraction",
  event: Events.InteractionCreate,
  once: false,

  async execute(client, interaction) {
    // Handle Welcome Canvas Studio Interactions (Templates, Colors, Shapes, Modals)
    const { handleWelcomeCanvasInteraction } = require("../lib/welcome/handleWelcomeCanvasInteraction");
    const handledWelcomeCanvas = await handleWelcomeCanvasInteraction(client, interaction);
    if (handledWelcomeCanvas) return;

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
              .setEmoji("<a:tada2:1530099488398508073>")
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
            content: `<a:tada2:1530099488398508073> You have successfully **entered** the giveaway! (Total entries: \`${res.totalEntries}\`)`,
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

    if (Command.devOnly && !client.developer.includes(interaction.user.id)) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Developer Access Restricted\n` +
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
            `### <a:red_star:1528688099436003419> Permission Required\n` +
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

    if (Command.botPermissions && Command.botPermissions.length !== 0) {
      if (
        !interaction.guild.members.me.permissions.has(Command.botPermissions)
      ) {
        const perms = Array.isArray(Command.botPermissions)
          ? Command.botPermissions.join(", ")
          : Command.botPermissions;
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Bot Permission Required\n` +
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

    Command.execute(client, interaction);
  },
};
