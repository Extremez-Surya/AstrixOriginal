const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const moderationManager = require("../../lib/moderationManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["release", "undetain", "unquarantine"],
  category: "Moderation",
  desc: "Release a member from detention and automatically restore their previous roles.",
  botPermissions: ["ManageRoles", "SendMessages"],
  userPermissions: ["ModerateMembers", "ManageRoles"],
  devOnly: false,

  async execute(client, message, args) {
    const targetMember = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

    if (!targetMember) {
      return message.reply("Usage: `.release @user`");
    }

    const detainedData = moderationManager.releaseMember(message.guild.id, targetMember.id);
    if (!detainedData) {
      return message.reply(`ℹ️ ${targetMember.user.username} is not currently in detention records.`);
    }

    // Remove Detained role
    const detainRole = message.guild.roles.cache.find((r) => r.name.toLowerCase() === "detained");
    if (detainRole) {
      await targetMember.roles.remove(detainRole.id, `Released by ${message.author.tag}`).catch(() => null);
    }

    // Restore previous roles
    let restoredCount = 0;
    if (detainedData.roles?.length > 0) {
      for (const rId of detainedData.roles) {
        if (message.guild.roles.cache.has(rId)) {
          await targetMember.roles.add(rId, `Restoring roles after release`).catch(() => null);
          restoredCount++;
        }
      }
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🕊️ **Member Released from Detention** ── ${targetMember.user.username}\n` +
        `-# *Quarantine lifted and roles restored*\n\n` +
        `> - **Roles Restored:** \`${restoredCount}\` role(s)\n` +
        `> - **Released by:** <@${message.author.id}>`
      )
    );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
