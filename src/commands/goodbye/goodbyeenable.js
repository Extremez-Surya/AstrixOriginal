const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const goodbyeManager = require("../../lib/goodbyeManager");

module.exports = {
  alias: ["goodbyeenable", "leaveenable", "goodbyeon", "leaveon"],
  category: "Goodbye",
  desc: "Activate the member departure and goodbye greetings module.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const config = goodbyeManager.getGuildGoodbye(message.guild.id);

    if (!config.channels || config.channels.length === 0) {
      return message.reply("❌ Add a goodbye channel first with `.goodbyechannel #channel` or `.leavechannel #channel`.").catch(() => null);
    }

    goodbyeManager.updateGuildGoodbye(message.guild.id, { enabled: true });
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### <:red_star:1539875482680696834> Goodbye Module Activated\n` +
        `-# *Farewell messages for departing members are now ENABLED.*\n\n` +
        `> - **Goodbye Channels:** ${config.channels.map(c => `<#${c.channelId}>`).join(", ")}\n` +
        `> - **Tip:** Use \`.goodbyetest\` or \`.leavetest\` to preview your leave card!`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
