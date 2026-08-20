const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["raidwipe", "cleanraid", "wiperaid"],
  category: "Moderation",
  desc: "Emergency wipe messages from newly joined accounts (e.g. accounts joined in the last 15 minutes).",
  botPermissions: ["ManageMessages", "SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const minutes = parseInt(args[0], 10) || 15;
    const threshold = Date.now() - (minutes * 60 * 1000);

    const fetched = await message.channel.messages.fetch({ limit: 100 }).catch(() => null);
    if (!fetched || fetched.size === 0) {
      return message.reply("❌ No messages found to inspect.");
    }

    const raidMessages = fetched.filter((m) => {
      const member = message.guild.members.cache.get(m.author.id);
      return member && member.joinedTimestamp && member.joinedTimestamp > threshold && !m.author.bot;
    });

    if (raidMessages.size === 0) {
      return message.reply(`ℹ️ No messages found from members who joined within the last ${minutes} minutes.`);
    }

    try {
      const deleted = await message.channel.bulkDelete(raidMessages, true);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🛡️ **Raid Wipe Completed**\n` +
          `-# *Cleaned recent messages from raiders/new accounts*\n\n` +
          `> - **Messages Purged:** \`${deleted.size}\`\n` +
          `> - **Join Window:** \`Last ${minutes} minutes\`\n` +
          `> - **Executed by:** <@${message.author.id}>`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      return message.reply(`❌ Failed to bulk delete messages: \`${err.message}\``);
    }
  },
};
