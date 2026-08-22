const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const welcomeManager = require("../../lib/welcomeManager");

module.exports = {
  alias: ["welcomeenable", "enablewelcome", "welcomon"],
  category: "Welcome",
  desc: "Enable server welcome greetings module.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const config = welcomeManager.updateGuildWelcome(message.guild.id, { enabled: true });
    const channelMention = config.channelId ? `<#${config.channelId}>` : "`Not set (use .welcomechannel #channel)`";

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### <:red_star:1539875482680696834> Welcome Module Activated\n` +
        `-# *Greetings for new member joins are now ENABLED.*\n\n` +
        `> - **Welcome Channel:** ${channelMention}\n` +
        `> - **Tip:** Use \`.welcometest\` to send a live test greeting!`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
