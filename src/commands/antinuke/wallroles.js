const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const antinukeManager = require("../../lib/antinukeManager");

module.exports = {
  alias: ["wallroles", "wallrole", "securitywall"],
  category: "Anti Nuke",
  desc: "View and manage Security Wall barrier roles.",
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const config = antinukeManager.getGuildAntinuke(message.guild.id);
    const wallRoles = config.wallRoles || (config.securityWallRole ? [config.securityWallRole] : []);

    const roleList = wallRoles.length > 0
      ? wallRoles.map((id) => {
          const role = message.guild.roles.cache.get(id);
          return role
            ? `> • <@&${role.id}> (\`${role.name}\`) — **${role.members.size}** members`
            : `> • Deleted Role (\`${id}\`)`;
        }).join("\n")
      : "> *No Security Wall roles configured.*";

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🛡️ **Astrix Security Wall Roles**\n\n` +
        `The Security Wall acts as a permission barrier between verified human members and untrusted users.\n\n` +
        `**Active Wall Roles:**\n${roleList}\n\n` +
        `**Commands:**\n` +
        `> • \`wallrole_add <@role>\` — Add a security wall role\n` +
        `> • \`wallrole_remove <@role>\` — Remove a security wall role`
      )
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
