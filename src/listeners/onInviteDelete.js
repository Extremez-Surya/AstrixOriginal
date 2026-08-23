const { Events } = require("discord.js");
const loggingManager = require("../lib/loggingManager");

module.exports = {
  name: "onInviteDelete",
  event: Events.InviteDelete,
  once: false,

  async execute(client, invite) {
    if (!invite || !invite.guild) return;

    await loggingManager.dispatchLog(
      client,
      invite.guild.id,
      "inviteDelete",
      {
        channel: invite.channel,
        details: `Invite code \`${invite.code}\` for <#${invite.channel?.id}> was deleted or expired.`,
      }
    ).catch(() => null);
  },
};
