const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const ticketManager = require("../../lib/ticketManager");

module.exports = {
  alias: ["ticketblacklist", "tktblacklist"],
  category: "Ticket",
  desc: "Blacklist or unblacklist a user/role from opening support tickets.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    let targetId;
    if (message.mentions.members.size > 0) {
      targetId = message.mentions.members.first().id;
    } else if (message.mentions.roles.size > 0) {
      targetId = message.mentions.roles.first().id;
    } else if (args[0]) {
      targetId = args[0].replace(/\D/g, "");
    }

    if (!targetId) {
      return message.reply("❌ Please mention or specify a user/role ID to blacklist or unblacklist!\n\n**Usage:** `.ticketblacklist @user`").catch(() => null);
    }

    const isCurrentlyBlacklisted = ticketManager.isBlacklisted(message.guild.id, targetId, []);

    if (isCurrentlyBlacklisted) {
      ticketManager.removeFromBlacklist(message.guild.id, targetId);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`✅ <@${targetId}> has been **removed** from the ticket blacklist.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    } else {
      ticketManager.addToBlacklist(message.guild.id, targetId);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`🚫 <@${targetId}> has been **added** to the ticket blacklist. They can no longer open tickets.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }
  },
};
