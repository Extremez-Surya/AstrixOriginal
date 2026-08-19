const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const noprefixManager = require("../../lib/noprefixManager");
const EMOJIS = require("../../lib/emojis");

function buildSuccessNotice(title, description) {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${EMOJIS.ticky_red || "✅"} ${title}`)
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(description));
}

function buildErrorNotice(title, description) {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${EMOJIS.cross || "❌"} ${title}`)
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(description));
}

module.exports = {
  name: "noprefix",
  category: "Owner",
  description: "Manage No-Prefix access for users, servers, or roles (Bot Owner Only).",
  type: ApplicationCommandType.ChatInput,
  botPermissions: [],
  userPermissions: [],
  devOnly: true,

  options: [
    {
      name: "add",
      description: "Grant No-Prefix access.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "type",
          description: "Target type (user, server, role).",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: "User", value: "user" },
            { name: "Server", value: "server" },
            { name: "Role", value: "role" },
          ],
        },
        {
          name: "target",
          description: "Target User, Server ID, or Role.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: "duration",
          description: "Duration (e.g. 30d, 7d, lifetime).",
          type: ApplicationCommandOptionType.String,
          required: false,
        },
      ],
    },
    {
      name: "remove",
      description: "Revoke No-Prefix access.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "type",
          description: "Target type (user, server, role).",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: "User", value: "user" },
            { name: "Server", value: "server" },
            { name: "Role", value: "role" },
          ],
        },
        {
          name: "target",
          description: "Target User ID, Server ID, or Role ID.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: "list",
      description: "List all active No-Prefix grants.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "status",
      description: "Check No-Prefix status for a target.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "user",
          description: "Target user to check.",
          type: ApplicationCommandOptionType.User,
          required: false,
        },
      ],
    },
  ],

  async execute(client, interaction) {
    if (!noprefixManager.isOwner(interaction.user.id, client)) {
      return interaction.reply({
        components: [buildErrorNotice("Access Denied", "Only Bot Owners can manage No-Prefix grants.")],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const subcommand = interaction.options.getSubcommand();
    const store = noprefixManager.getStore();
    const now = Date.now();

    if (subcommand === "list") {
      const activeUsers = (store.users || []).filter((u) => u.expiresAt > now);
      const activeServers = (store.servers || []).filter((s) => s.expiresAt > now);
      const activeRoles = (store.roles || []).filter((r) => r.expiresAt > now);

      let content = "";
      if (activeUsers.length > 0) {
        content += "**👤 Users**\n";
        for (const u of activeUsers) {
          content += `> <@${u.id}> — ${noprefixManager.formatExpiry(u.expiresAt)}\n`;
        }
        content += "\n";
      }

      if (activeServers.length > 0) {
        content += "**🏠 Servers**\n";
        for (const s of activeServers) {
          const guild = client.guilds.cache.get(s.id);
          content += `> ${guild?.name || s.id} — ${noprefixManager.formatExpiry(s.expiresAt)}\n`;
        }
        content += "\n";
      }

      if (activeRoles.length > 0) {
        content += "**🎭 Roles**\n";
        for (const r of activeRoles) {
          const guild = client.guilds.cache.get(r.guildId);
          const role = guild?.roles.cache.get(r.roleId);
          content += `> ${role?.name || r.roleId} in *${guild?.name || r.guildId}* — ${noprefixManager.formatExpiry(r.expiresAt)}\n`;
        }
      }

      if (!content) content = "*No active no-prefix grants.*";

      const listContainer = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### 📋 **ACTIVE NO-PREFIX GRANTS**`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

      return interaction.reply({
        components: [listContainer],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "status") {
      const targetUser = interaction.options.getUser("user") || interaction.user;
      const userId = targetUser.id;

      if (noprefixManager.isOwner(userId, client)) {
        return interaction.reply({
          components: [buildSuccessNotice("Bot Owner", `<@${userId}> has **Lifetime No-Prefix** access automatically as a Bot Owner.`)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      const userEntry = (store.users || []).find((u) => u.id === userId && u.expiresAt > now);
      if (userEntry) {
        return interaction.reply({
          components: [buildSuccessNotice("No-Prefix Active", `<@${userId}> has active No-Prefix access.\n> **Expires:** ${noprefixManager.formatExpiry(userEntry.expiresAt)}`)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      } else {
        return interaction.reply({
          components: [buildErrorNotice("No Access", `<@${userId}> does not have active No-Prefix access.`)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }
    }

    if (subcommand === "add") {
      const type = interaction.options.getString("type");
      const target = interaction.options.getString("target").replace(/[<@!&>]/g, "");
      const durationArg = interaction.options.getString("duration");
      const durationMs = noprefixManager.parseDuration(durationArg) || 90 * 24 * 60 * 60 * 1000;

      if (type === "user") {
        if (!durationArg) {
          const targetUser = await client.users.fetch(target).catch(() => null);
          if (targetUser) {
            const { buildDurationSelectionContainer } = require("../../lib/security/handleOwnerInteraction");
            const selectionContainer = buildDurationSelectionContainer(targetUser);
            return interaction.reply({
              components: [selectionContainer],
              flags: MessageFlags.IsComponentsV2,
            }).catch(() => null);
          }
        }

        const durationMs = noprefixManager.parseDuration(durationArg) || 90 * 24 * 60 * 60 * 1000;
        const durationLabel = noprefixManager.getDurationLabel(durationArg || durationMs);

        noprefixManager.addNoPrefixUser(target, durationMs, interaction.user.id);
        await noprefixManager.sendNoPrefixDM(client, target, durationLabel, true);

        return interaction.reply({
          components: [buildSuccessNotice("No-Prefix Granted", `Granted No-Prefix access to <@${target}> for **${durationLabel}**.\n\n-# Direct Message notification sent to user.`)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      if (type === "server") {
        const result = noprefixManager.addNoPrefixServer(target, durationMs, interaction.user.id);
        return interaction.reply({
          components: [buildSuccessNotice("No-Prefix Granted", `Granted No-Prefix access to Server \`${target}\` for **${noprefixManager.formatExpiry(result.expiresAt)}**.`)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      if (type === "role") {
        const result = noprefixManager.addNoPrefixRole(interaction.guild.id, target, durationMs, interaction.user.id);
        return interaction.reply({
          components: [buildSuccessNotice("No-Prefix Granted", `Granted No-Prefix access to Role <@&${target}> for **${noprefixManager.formatExpiry(result.expiresAt)}**.`)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }
    }

    if (subcommand === "remove") {
      const type = interaction.options.getString("type");
      const target = interaction.options.getString("target").replace(/[<@!&>]/g, "");

      if (type === "user") {
        const removed = noprefixManager.removeNoPrefixUser(target);
        if (removed) {
          await noprefixManager.sendNoPrefixDM(client, target, "Expired", false);
        }
        return interaction.reply({
          components: [
            removed
              ? buildSuccessNotice("No-Prefix Revoked", `<@${target}>'s No-Prefix access has been removed.\n\n-# Direct Message notification sent to user.`)
              : buildErrorNotice("Not Found", `<@${target}> didn't have active No-Prefix access.`),
          ],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      if (type === "server") {
        const removed = noprefixManager.removeNoPrefixServer(target);
        return interaction.reply({
          components: [
            removed
              ? buildSuccessNotice("No-Prefix Revoked", `Server \`${target}\` No-Prefix access has been removed.`)
              : buildErrorNotice("Not Found", `Server \`${target}\` didn't have active No-Prefix access.`),
          ],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      if (type === "role") {
        const removed = noprefixManager.removeNoPrefixRole(interaction.guild.id, target);
        return interaction.reply({
          components: [
            removed
              ? buildSuccessNotice("No-Prefix Revoked", `Role <@&${target}> No-Prefix access has been removed.`)
              : buildErrorNotice("Not Found", `Role <@&${target}> didn't have active No-Prefix access.`),
          ],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }
    }
  },
};
