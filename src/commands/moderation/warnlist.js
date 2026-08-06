const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const { getWarns } = require("../../utils/warnManager.js");

module.exports = {
  alias: ["warnlist", "warns"],
  category: "Moderation",
  desc: "List all warnings for a server member.",
  botPermissions: ["SendMessages"],
  userPermissions: ["KickMembers"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser =
      message.mentions.users.first() ||
      (args[0]
        ? await client.users.fetch(args[0]).catch(() => null)
        : message.author);
    const member = await message.guild.members
      .fetch(targetUser.id)
      .catch(() => null);
    if (!member) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Member Not Found\n` +
            `-# *This user is not currently in this server.*`,
        ),
      );
      return message
        .reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        })
        .catch(() => null);
    }

    const warns = getWarns(message.guild.id, targetUser.id);
    if (warns.length === 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:online:1528327584520081519> Clean Disciplinary Record\n` +
            `-# *<@${targetUser.id}> (${targetUser.username}) has no warning history.*`,
        ),
      );
      return message
        .reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        })
        .catch(() => null);
    }

    const listLines = warns.map((w, index) => {
      const dateStr = `<t:${Math.floor(w.timestamp / 1000)}:R>`;
      return `\`#${index + 1}\` | **Reason:** ${w.reason}\n   ↳ *Warned by <@${w.moderatorId}> at ${dateStr}*`;
    });

    const content = [
      `### <:rshield:1528681364340080713> Warnings History: ${targetUser.username}`,
      `-# *Persistent disciplinary logs mapped to this member.*`,
      "",
      listLines.join("\n\n"),
    ].join("\n");

    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# *<:astrix:1527205612205903973> Warning Records • Powered by ASTRIXCODE™ • © 2026*`,
        ),
      );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });
  },
};
