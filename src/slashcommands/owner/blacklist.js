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
  name: "blacklist",
  category: "Owner",
  description: "Blacklist or unblacklist users/servers from Astrix (Bot Owner Only).",
  type: ApplicationCommandType.ChatInput,
  botPermissions: [],
  userPermissions: [],
  devOnly: true,

  options: [
    {
      name: "add",
      description: "Add a user or server to the blacklist.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "type",
          description: "Target type (user or server).",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: "User", value: "user" },
            { name: "Server", value: "server" },
          ],
        },
        {
          name: "target",
          description: "Target User ID or Server ID.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: "reason",
          description: "Reason for blacklisting.",
          type: ApplicationCommandOptionType.String,
          required: false,
        },
      ],
    },
    {
      name: "remove",
      description: "Remove a user or server from the blacklist.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "type",
          description: "Target type (user or server).",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: "User", value: "user" },
            { name: "Server", value: "server" },
          ],
        },
        {
          name: "target",
          description: "Target User ID or Server ID.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: "list",
      description: "List all blacklisted users and servers.",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],

  async execute(client, interaction) {
    if (!noprefixManager.isOwner(interaction.user.id, client)) {
      return interaction.reply({
        components: [buildErrorNotice("Access Denied", "Only Bot Owners can manage global blacklists.")],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const subcommand = interaction.options.getSubcommand();
    const store = noprefixManager.getStore();

    if (subcommand === "list") {
      const users = store.blacklistedUsers || [];
      const servers = store.blacklistedServers || [];

      let userText = users.length > 0 ? users.map((u, i) => `\`${i + 1}.\` <@${u.id}> (\`${u.id}\`) — Reason: ${u.reason}`).join("\n") : "*No blacklisted users.*";
      let serverText = servers.length > 0 ? servers.map((s, i) => `\`${i + 1}.\` ID: \`${s.id}\` — Reason: ${s.reason}`).join("\n") : "*No blacklisted servers.*";

      const container = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### 🚫 **GLOBAL BLACKLIST DIRECTORY**`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**👤 Blacklisted Users:**\n${userText}\n\n**🏠 Blacklisted Servers:**\n${serverText}`));

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    const type = interaction.options.getString("type");
    const targetId = interaction.options.getString("target").replace(/[<@!>]/g, "");
    const reason = interaction.options.getString("reason") || "Violated terms of service.";

    if (type === "user") {
      if (subcommand === "add") {
        if (noprefixManager.isOwner(targetId, client)) {
          return interaction.reply({
            components: [buildErrorNotice("Action Blocked", "You cannot blacklist a Bot Owner.")],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          }).catch(() => null);
        }

        noprefixManager.addBlacklistUser(targetId, reason, interaction.user.id);
        return interaction.reply({
          components: [buildSuccessNotice("User Blacklisted", `User <@${targetId}> has been blacklisted from using Astrix.\n> **Reason:** ${reason}`)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      if (subcommand === "remove") {
        const removed = noprefixManager.removeBlacklistUser(targetId);
        return interaction.reply({
          components: [
            removed
              ? buildSuccessNotice("Blacklist Revoked", `User <@${targetId}> has been unblacklisted.`)
              : buildErrorNotice("Not Found", `User <@${targetId}> is not in the blacklist directory.`),
          ],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }
    }

    if (type === "server") {
      if (subcommand === "add") {
        noprefixManager.addBlacklistServer(targetId, reason, interaction.user.id);
        return interaction.reply({
          components: [buildSuccessNotice("Server Blacklisted", `Server \`${targetId}\` has been blacklisted.\n> **Reason:** ${reason}`)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      if (subcommand === "remove") {
        const removed = noprefixManager.removeBlacklistServer(targetId);
        return interaction.reply({
          components: [
            removed
              ? buildSuccessNotice("Blacklist Revoked", `Server \`${targetId}\` has been unblacklisted.`)
              : buildErrorNotice("Not Found", `Server \`${targetId}\` is not in the blacklist directory.`),
          ],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }
    }
  },
};
