const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");

const channelSnapshots = new Map(); // channelId -> snapshot data

module.exports = {
  alias: ["snapshot", "channelsnapshot", "backupperms"],
  category: "Moderation",
  desc: "Take a backup snapshot of a channel's permissions and settings or restore a previous snapshot.",
  botPermissions: ["ManageChannels", "SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const action = args[0]?.toLowerCase();
    const targetChannel = message.mentions.channels.first() || message.channel;

    // 1. Restore Snapshot: .snapshot restore [#channel]
    if (action === "restore") {
      const snap = channelSnapshots.get(targetChannel.id);
      if (!snap) {
        return message.reply(`❌ No snapshot found for ${targetChannel}. Take one first with \`.snapshot create\`.`);
      }

      try {
        await targetChannel.setTopic(snap.topic || null);
        await targetChannel.setRateLimitPerUser(snap.rateLimit || 0);

        if (snap.overwrites) {
          await targetChannel.permissionOverwrites.set(snap.overwrites);
        }

        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🔄 **Channel Snapshot Restored** ── ${targetChannel}\n` +
            `-# *Permissions, topic, and slowmode successfully restored from backup.*\n\n` +
            `> - **Snapshot Age:** <t:${Math.floor(snap.timestamp / 1000)}:R>\n` +
            `> - **Restored by:** <@${message.author.id}>`
          )
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      } catch (err) {
        return message.reply(`❌ Failed to restore snapshot: \`${err.message}\``);
      }
    }

    // 2. Create Snapshot: .snapshot create [#channel]
    const overwritesArray = Array.from(targetChannel.permissionOverwrites.cache.values()).map((ow) => ({
      id: ow.id,
      type: ow.type,
      allow: ow.allow.bitfield.toString(),
      deny: ow.deny.bitfield.toString(),
    }));

    channelSnapshots.set(targetChannel.id, {
      topic: targetChannel.topic,
      rateLimit: targetChannel.rateLimitPerUser,
      overwrites: overwritesArray,
      timestamp: Date.now(),
    });

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 📸 **Channel Snapshot Created** ── ${targetChannel}\n` +
        `-# *Current permissions, topic, and rate limits saved to memory.*\n\n` +
        `> - **Overwrites Saved:** \`${overwritesArray.length}\` permission entries\n` +
        `> - **Topic:** \`${targetChannel.topic || "None"}\`\n\n` +
        `-# *Tip: Use \`.snapshot restore\` to revert any unwanted permission changes.*`
      )
    );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
