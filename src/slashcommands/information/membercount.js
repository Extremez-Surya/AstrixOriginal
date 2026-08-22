const {
  ApplicationCommandType,
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");

module.exports = {
  name: "membercount",
  category: "Information",
  description: "View the server's current member count.",
  type: ApplicationCommandType.ChatInput,

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    const guild = interaction.guild;
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
      `# <:members:1539875392532512808> Server Population\n` +
      `-# *Current user metrics for the server.*\n\n` +
      `<:stats:1539875420256866314> **Statistics**\n` +
      `> -# <:servers:1539875396546207795> **Guild Name** ─ \`${guild.name}\`\n` +
      `> -# <:members:1539875392532512808> **Total Members** ─ \`${totalCount.toLocaleString()}\`\n\n` +
      `<:stats:1539875420256866314> **Status Breakdown**\n` +
      `> -# <:online:1539875424144859239> **Online** ─ \`${online.toLocaleString()}\`\n` +
      `> -# <:idle:1539875427722727565> **Idle** ─ \`${idle.toLocaleString()}\`\n` +
      `> -# <:DoNotDisturb:1539875432717881435> **Do Not Disturb** ─ \`${dnd.toLocaleString()}\`\n` +
      `> -# <:offline:1539875436690153474> **Offline** ─ \`${offline.toLocaleString()}\``;

    if (!hasPresences) {
      mainContent += `\n\n<:Warn_red:1539875499147399218> *Enable Presence Intent in Discord Developer Portal to view status counts.*`;
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(mainContent),
    );

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
