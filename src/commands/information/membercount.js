const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");

module.exports = {
  alias: ["membercount", "mc"],
  category: "Information",
  desc: "View the server's current member count.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const guild = message.guild;
    const totalCount = guild.memberCount;

    // Fetch members with presence information
    let members;
    try {
      members = await guild.members.fetch({ withPresences: true });
    } catch (e) {
      members = guild.members.cache;
    }

    let online = 0;
    let idle = 0;
    let dnd = 0;
    let offline = 0;

    members.forEach((member) => {
      if (!member.presence) {
        offline++;
      } else {
        switch (member.presence.status) {
          case "online":
            online++;
            break;
          case "idle":
            idle++;
            break;
          case "dnd":
            dnd++;
            break;
          case "offline":
            offline++;
            break;
          default:
            offline++;
            break;
        }
      }
    });

    // If fetch didn't return all members (e.g. cache only), adjust offline count
    if (members.size < totalCount) {
      offline += totalCount - members.size;
    }

    const hasPresences = online + idle + dnd > 0;

    // Main Content
    let mainContent =
      `# <:members:1528311049726591006> Server Population\n` +
      `-# *Current user metrics for the server.*\n\n` +
      `<:stats:1528322466521546826> **Statistics**\n` +
      `> -# <:servers:1528311514065535007> **Guild Name** ─ \`${guild.name}\`\n` +
      `> -# <:members:1528311049726591006> **Total Members** ─ \`${totalCount.toLocaleString()}\`\n\n` +
      `<:stats:1528322466521546826> **Status Breakdown**\n` +
      `> -# <:online:1528327584520081519> **Online** ─ \`${online.toLocaleString()}\`\n` +
      `> -# <:idle:1528327733191643189> **Idle** ─ \`${idle.toLocaleString()}\`\n` +
      `> -# <:DoNotDisturb:1528327971570450502> **Do Not Disturb** ─ \`${dnd.toLocaleString()}\`\n` +
      `> -# <:offline:1528328082434424892> **Offline** ─ \`${offline.toLocaleString()}\``;

    if (!hasPresences) {
      mainContent += `\n\n<:Warn_red:1528691439658078290> *Enable Presence Intent in Discord Developer Portal to view status counts.*`;
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(mainContent),
    );

    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
