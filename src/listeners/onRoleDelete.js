const { Events } = require("discord.js");
const loggingManager = require("../lib/loggingManager");

module.exports = {
  name: "onRoleDelete",
  event: Events.GuildRoleDelete,
  once: false,

  async execute(client, role) {
    if (!role.guild) return;
    loggingManager.dispatchLog(
      client,
      role.guild.id,
      "roleDelete",
      {
        details: `Role deleted: \`@${role.name}\` (\`${role.id}\`)`,
      }
    ).catch(() => null);
  },
};
