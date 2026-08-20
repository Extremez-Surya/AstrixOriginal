const { Events } = require("discord.js");
const loggingManager = require("../lib/loggingManager");

module.exports = {
  name: "onRoleCreate",
  event: Events.GuildRoleCreate,
  once: false,

  async execute(client, role) {
    if (!role.guild) return;
    loggingManager.dispatchLog(
      client,
      role.guild.id,
      "roleCreate",
      {
        role,
        details: `Role created: <@&${role.id}> (\`${role.name}\`) • Color: \`${role.hexColor}\``,
      }
    ).catch(() => null);
  },
};
