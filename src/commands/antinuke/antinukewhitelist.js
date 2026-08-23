const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const antinukeManager = require("../../lib/antinukeManager");
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
  alias: ["antinukewhitelist", "anwl"],
  category: "Anti Nuke",
  desc: "Manage immune whitelisted users for Anti-Nuke defense.",
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const isOwner = message.guild.ownerId === message.author.id;
    const config = antinukeManager.getGuildAntinuke(message.guild.id);
    const isExtraOwner = (config.extraOwners || []).includes(message.author.id);
    const isDev = client.developer && Array.isArray(client.developer) && client.developer.includes(message.author.id);

    if (!isOwner && !isExtraOwner && !isDev) {
      return message.reply({
        components: [
          buildErrorNotice(
            "Access Denied",
            "Only the **Guild Owner** or designated **Extra Owners** can configure the Anti-Nuke whitelist."
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const guildId = message.guild.id;
    const action = args[0]?.toLowerCase();
    const targetUser = message.mentions.users.first() || (args[1] ? await client.users.fetch(args[1]).catch(() => null) : null);

    if (!action || action === "view" || action === "list" || action === "show") {
      const list = (config.whitelist || []).map((id, i) => `\`${i + 1}.\` <@${id}> (\`${id}\`)`).join("\n") || "*No whitelisted users.*";
      return message.reply({
        components: [buildSuccessNotice("Anti-Nuke Whitelist Directory", list)],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    if (action === "clear" || action === "reset") {
      if (targetUser) {
        antinukeManager.removeWhitelist(guildId, targetUser.id);
        return message.reply({
          components: [buildSuccessNotice("Whitelist Reset", `<@${targetUser.id}> removed from the anti-nuke whitelist.`)],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }
      antinukeManager.clearWhitelist(guildId);
      return message.reply({
        components: [buildSuccessNotice("Whitelist Reset", "All users removed from anti-nuke whitelist.")],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    if (!targetUser) {
      return message.reply({
        components: [buildErrorNotice("User Required", "Usage: `.antinukewhitelist <add|remove|view|clear> [user]`")],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    if (action === "add") {
      const added = antinukeManager.addWhitelist(guildId, targetUser.id);
      return message.reply({
        components: [
          added
            ? buildSuccessNotice("User Whitelisted", `<@${targetUser.id}> is now whitelisted and immune to Anti-Nuke enforcement.`)
            : buildErrorNotice("Already Whitelisted", `<@${targetUser.id}> is already whitelisted.`),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    if (action === "remove") {
      const removed = antinukeManager.removeWhitelist(guildId, targetUser.id);
      return message.reply({
        components: [
          removed
            ? buildSuccessNotice("User Removed", `<@${targetUser.id}> removed from the anti-nuke whitelist.`)
            : buildErrorNotice("Not Whitelisted", `<@${targetUser.id}> is not in the whitelist.`),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }
  },
};
