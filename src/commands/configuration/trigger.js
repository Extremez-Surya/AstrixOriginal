const { MessageFlags, PermissionFlagsBits, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require("discord.js");
const configManager = require("../../lib/configManager");
const noprefixManager = require("../../lib/noprefixManager");
const EMOJIS = require("../../lib/emojis");

function buildNotice(title, description) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${title}`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(description))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Hardened Configuration Engine`));
  return { components: [container], flags: MessageFlags.IsComponentsV2, allowedMentions: { repliedUser: false } };
}

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  name: "trigger",
  alias: ["trigger", "triggers", "autoresponder", "ar"],
  category: "Configuration",
  desc: "Manage custom auto-responder phrase triggers and automated response cards.",
  botPermissions: ["SendMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const isMemberPermitted = message.member?.permissions.has(PermissionFlagsBits.ManageGuild);
    const isBotOwner = noprefixManager.isOwner(message.author.id, client);

    if (!isMemberPermitted && !isBotOwner) {
      return message.reply(buildNotice(`${EMOJIS.error || "❌"} Missing Permissions`, "Manage Server permission required."));
    }

    const config = configManager.getGuildConfig(message.guild.id);
    const sub = args[0]?.toLowerCase();

    if (sub === "add" || sub === "create") {
      const fullArgs = args.slice(1).join(" ");
      const splitIdx = fullArgs.indexOf("|");

      if (splitIdx === -1) {
        return message.reply(buildNotice(`${EMOJIS.error || "❌"} Invalid Format`, "Usage: `.trigger add <trigger> | <response>`\nExample: `.trigger add hello | Hello {user}! Welcome to {server}!`"));
      }

      const trig = fullArgs.slice(0, splitIdx).trim();
      const resp = fullArgs.slice(splitIdx + 1).trim();

      if (!trig || !resp) {
        return message.reply(buildNotice(`${EMOJIS.error || "❌"} Invalid Format`, "Trigger phrase and response text cannot be empty."));
      }

      config.triggers.push({
        id: `trig_${Date.now()}`,
        trigger: trig,
        response: resp,
        matchMode: "includes",
        enabled: true,
        useComponentsV2: true,
      });

      configManager.setGuildConfig(message.guild.id, config);
      return message.reply(buildNotice(`${EMOJIS.success || "✅"} Auto-Responder Trigger Added`, `**Trigger:** \`${trig}\`\n**Response:** ${resp}`));
    }

    if (sub === "remove" || sub === "delete" || sub === "del") {
      const targetTrig = args.slice(1).join(" ").trim().toLowerCase();
      if (!targetTrig) {
        return message.reply(buildNotice(`${EMOJIS.error || "❌"} Missing Trigger`, "Usage: `.trigger remove <trigger>`"));
      }

      const initialLen = config.triggers.length;
      config.triggers = config.triggers.filter((t) => (t.trigger || "").toLowerCase() !== targetTrig);

      if (config.triggers.length < initialLen) {
        configManager.setGuildConfig(message.guild.id, config);
        return message.reply(buildNotice(`${EMOJIS.success || "✅"} Trigger Removed`, `Removed trigger \`${targetTrig}\`.`));
      } else {
        return message.reply(buildNotice(`${EMOJIS.error || "❌"} Not Found`, `Trigger \`${targetTrig}\` not found.`));
      }
    }

    if (sub === "list" || sub === "ls") {
      if (!config.triggers || config.triggers.length === 0) {
        return message.reply(buildNotice(`${EMOJIS.info || "📋"} Trigger Directory`, "*No auto-responder triggers configured.*"));
      }

      let listStr = "";
      config.triggers.forEach((t, i) => {
        listStr += `**#${i + 1} Trigger:** \`${t.trigger}\` • **Match:** \`${t.matchMode || "includes"}\`\n> **Response:** ${t.response}\n\n`;
      });

      return message.reply(buildNotice(`${EMOJIS.info || "📋"} Auto-Responder Triggers`, listStr));
    }

    if (sub === "clear" || sub === "reset") {
      config.triggers = [];
      configManager.setGuildConfig(message.guild.id, config);
      return message.reply(buildNotice(`${EMOJIS.success || "✅"} Triggers Cleared`, "All auto-responder triggers have been cleared."));
    }

    // Default Help Notice
    return message.reply(
      buildNotice(
        "🤖 Auto-Responder Trigger Commands",
        "**Usage:**\n" +
        "> `.trigger add <trigger> | <response>` — Add auto-responder\n" +
        "> `.trigger remove <trigger>` — Remove auto-responder\n" +
        "> `.trigger list` — View all active triggers\n" +
        "> `.trigger clear` — Clear all triggers\n\n" +
        "**Placeholders:** `{user}`, `{user_name}`, `{server}`, `{channel}`, `{time}`, `{date}`, `{timestamp}`"
      )
    );
  },
};
