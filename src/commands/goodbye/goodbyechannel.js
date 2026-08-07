const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const goodbyeManager = require("../../lib/goodbyeManager");

module.exports = {
  alias: ["goodbyechannel", "leavechannel", "setgoodbyechannel", "setleavechannel"],
  category: "Goodbye",
  desc: "Set or add the text channel for member leave & goodbye greetings.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);

    if (!channel) {
      const config = goodbyeManager.getGuildGoodbye(message.guild.id);
      const current = config.channels && config.channels.length > 0
        ? config.channels.map((c) => `<#${c.channelId}>`).join(", ")
        : "`None`";

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 👋 Goodbye Channel Settings\n` +
          `-# *Select where member leave greetings are posted.*\n\n` +
          `> - **Usage:** \`.goodbyechannel #channel\` or \`.leavechannel #channel\`\n` +
          `> - **Active Channels:** ${current}`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    goodbyeManager.addGoodbyeChannel(message.guild.id, {
      channelId: channel.id,
    });
    goodbyeManager.updateGuildGoodbye(message.guild.id, { enabled: true });

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ✅ Goodbye Channel Updated\n` +
        `-# *Leave greetings are now active in ${channel}.*\n\n` +
        `> - **Target Channel:** ${channel} (\`${channel.id}\`)`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
