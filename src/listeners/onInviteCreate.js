const { Events } = require("discord.js");
const loggingManager = require("../lib/loggingManager");

module.exports = {
  name: "onInviteCreate",
  event: Events.InviteCreate,
  once: false,

  async execute(client, invite) {
    if (!invite || !invite.guild) return;

    await loggingManager.dispatchLog(
      client,
      invite.guild.id,
      "inviteCreate",
      {
        executor: invite.inviter,
        channel: invite.channel,
        details: `Invite code \`${invite.code}\` created for <#${invite.channel?.id}> • Max Uses: \`${invite.maxUses || "Unlimited"}\` • Expires: \`${invite.expiresAt ? new Date(invite.expiresAt).toLocaleString() : "Never"}\``,
      }
    ).catch(() => null);
  },
};
