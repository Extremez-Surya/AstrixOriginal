const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const moderationManager = require("../../lib/moderationManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["forcenickname", "freezenick", "locknick", "forcenick"],
  category: "Moderation",
  desc: "Lock and freeze a member's nickname to prevent them from changing it.",
  botPermissions: ["ManageNicknames", "SendMessages"],
  userPermissions: ["ManageNicknames"],
  devOnly: false,

  async execute(client, message, args) {
    const targetMember = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

    if (!targetMember) {
      return message.reply("Usage: `.forcenickname @user <nickname | reset>`");
    }

    const check = moderationManager.canModerate(message.member, targetMember, message.guild.members.me);
    if (!check.allowed) {
      return message.reply(`❌ Action Denied: ${check.reason}`);
    }

    const desiredNick = args.slice(1).join(" ");

    // Unlock / Unfreeze
    if (!desiredNick || desiredNick.toLowerCase() === "reset" || desiredNick.toLowerCase() === "clear") {
      moderationManager.unfreezeNickname(message.guild.id, targetMember.id);
      await targetMember.setNickname(null, `Nickname unfreezed by ${message.author.tag}`).catch(() => null);

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔓 **Nickname Unfrozen** ── ${targetMember.user.username}\n` +
          `-# *Member can now freely update their nickname again.*`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    // Freeze / Lock
    const cleanNick = desiredNick.slice(0, 32);
    await targetMember.setNickname(cleanNick, `Frozen by ${message.author.tag}`).catch(() => null);
    moderationManager.freezeNickname(message.guild.id, targetMember.id, cleanNick);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🔒 **Nickname Frozen (Anti-Bypass Guard)** ── ${targetMember.user.username}\n` +
        `-# *Nickname is locked and will automatically re-apply if changed.*\n\n` +
        `> - **Locked Nickname:** \`${cleanNick}\`\n` +
        `> - **Moderator:** <@${message.author.id}>\n\n` +
        `-# *Tip: Use \`.forcenickname @user reset\` to unlock.*`
      )
    );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
