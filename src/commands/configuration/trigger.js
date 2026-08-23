const { MessageFlags, PermissionFlagsBits } = require("discord.js");
const configManager = require("../../lib/configManager");
const noprefixManager = require("../../lib/noprefixManager");
const { buildConfigurationContainer } = require("../../lib/security/handleConfigurationInteraction");

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
      return message.reply({
        content: "❌ You need **Manage Server** permission to configure auto-responder triggers.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const config = configManager.getGuildConfig(message.guild.id);
    const sub = args[0]?.toLowerCase();

    // 1. .trigger add <phrase> | <response>
    if (sub === "add" || sub === "create" || sub === "set") {
      const fullArgs = args.slice(1).join(" ");
      const splitIdx = fullArgs.indexOf("|");

      if (splitIdx === -1) {
        return message.reply({
          content: "⚠️ **Invalid Format.**\n*Usage:* `.trigger add <phrase> | <response>`\n*Example:* `.trigger add vanity | Join discord.gg/astrix for cool perks!`",
        }).catch(() => null);
      }

      const trig = fullArgs.slice(0, splitIdx).trim();
      const resp = fullArgs.slice(splitIdx + 1).trim();

      if (!trig || !resp) {
        return message.reply({
          content: "⚠️ Trigger phrase and response text cannot be empty.",
        }).catch(() => null);
      }

      const existingIdx = config.triggers.findIndex(
        (t) => (t.trigger || "").toLowerCase() === trig.toLowerCase()
      );

      if (existingIdx !== -1) {
        config.triggers[existingIdx].response = resp;
        config.triggers[existingIdx].matchMode = "exact";
      } else {
        config.triggers.push({
          id: `trig_${Date.now()}`,
          trigger: trig,
          response: resp,
          matchMode: "exact",
          enabled: true,
          useComponentsV2: true,
        });
      }

      configManager.setGuildConfig(message.guild.id, config);
      const container = buildConfigurationContainer(message.guild, "triggers");
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 2. .trigger edit <phrase> | <new response>
    if (sub === "edit" || sub === "update" || sub === "modify") {
      const fullArgs = args.slice(1).join(" ");
      const splitIdx = fullArgs.indexOf("|");

      if (splitIdx === -1) {
        return message.reply({
          content: "⚠️ **Invalid Format.**\n*Usage:* `.trigger edit <phrase> | <new response>`\n*Example:* `.trigger edit vanity | New custom response message!`",
        }).catch(() => null);
      }

      const trig = fullArgs.slice(0, splitIdx).trim();
      const newResp = fullArgs.slice(splitIdx + 1).trim();

      if (!trig || !newResp) {
        return message.reply({
          content: "⚠️ Trigger phrase and response text cannot be empty.",
        }).catch(() => null);
      }

      const updated = configManager.editTrigger(message.guild.id, trig, newResp, "exact");

      if (!updated) {
        return message.reply({
          content: `⚠️ Trigger \`${trig}\` was not found. Use \`.trigger add ${trig} | ${newResp}\` to create it.`,
        }).catch(() => null);
      }

      const container = buildConfigurationContainer(message.guild, "triggers");
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 3. .trigger remove <phrase>
    if (sub === "remove" || sub === "delete" || sub === "del") {
      const targetTrig = args.slice(1).join(" ").trim().toLowerCase();
      if (!targetTrig) {
        return message.reply({
          content: "⚠️ Please specify a trigger to remove.\n*Usage:* `.trigger remove <phrase>`",
        }).catch(() => null);
      }

      const initialLen = config.triggers.length;
      config.triggers = config.triggers.filter((t) => (t.trigger || "").toLowerCase() !== targetTrig);

      if (config.triggers.length < initialLen) {
        configManager.setGuildConfig(message.guild.id, config);
      }

      const container = buildConfigurationContainer(message.guild, "triggers");
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 4. .trigger clear
    if (sub === "clear" || sub === "reset") {
      config.triggers = [];
      configManager.setGuildConfig(message.guild.id, config);
      const container = buildConfigurationContainer(message.guild, "triggers");
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Default / list: Open Triggers Tab
    const container = buildConfigurationContainer(message.guild, "triggers");
    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
