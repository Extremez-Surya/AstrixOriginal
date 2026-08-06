const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  parseEmoji,
} = require("discord.js");

module.exports = {
  alias: ["roleicon", "setroleicon"],
  category: "Moderation",
  desc: "Set or remove a role icon (boosted server feature).",

  botPermissions: ["ManageRoles"],
  userPermissions: ["ManageRoles"],
  devOnly: false,

  async execute(client, message, args) {
    const roleArg = args[0];
    const iconArg = args[1];

    if (!roleArg) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Missing Arguments\n` +
            `-# *Usage: \`.roleicon <@role | role_id> <emoji | image_url | reset>\`*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const role =
      message.mentions.roles.first() ||
      message.guild.roles.cache.get(roleArg.replace(/[<@&>]/g, ""));

    if (!role) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Role Not Found\n` +
            `-# *Could not find specified role in this server.*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    if (role.position >= message.guild.members.me.roles.highest.position) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Hierarchy Check Failed\n` +
            `-# *I cannot modify this role because it is higher than or equal to my highest role.*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    try {
      if (!iconArg || iconArg.toLowerCase() === "reset" || iconArg.toLowerCase() === "remove") {
        await role.setIcon(null, `Icon reset by ${message.author.tag}`);
        const container = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### <:astrix:1527205612205903973> Role Icon Reset\n` +
                `-# *Successfully removed custom icon from <@&${role.id}>.*`,
            ),
          )
          .addSeparatorComponents(
            new SeparatorBuilder()
              .setSpacing(SeparatorSpacingSize.Small)
              .setDivider(true),
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `-# *Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE*`,
            ),
          );
        return message
          .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
          .catch(() => null);
      }

      let iconUrl = iconArg;
      const parsed = parseEmoji(iconArg);
      if (parsed && parsed.id) {
        iconUrl = `https://cdn.discordapp.com/emojis/${parsed.id}.png`;
      } else if (message.attachments.first()) {
        iconUrl = message.attachments.first().url;
      }

      await role.setIcon(iconUrl, `Icon updated by ${message.author.tag}`);

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:astrix:1527205612205903973> Role Icon Updated\n` +
              `-# *Successfully set role icon for <@&${role.id}>.*`,
          ),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# *Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE*`,
          ),
        );

      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    } catch (err) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Failed to Update Role Icon\n` +
            `-# *${err.message || "An error occurred (Server requires Level 2 Boost for role icons)."}*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }
  },
};
