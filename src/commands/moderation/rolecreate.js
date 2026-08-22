const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");

module.exports = {
  alias: ["rolecreate", "createrole", "addrolecreate"],
  category: "Moderation",
  desc: "Create a new role with a name and hex color.",

  botPermissions: ["ManageRoles"],
  userPermissions: ["ManageRoles"],
  devOnly: false,

  async execute(client, message, args) {
    const name = args[0];
    const color = args[1] || "#99AAB5";

    if (!name) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Missing Role Name\n` +
            `-# *Usage: \`.rolecreate <role_name> [hex_color]\` (e.g. \`.rolecreate Moderator #ff0000\`)*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    try {
      const role = await message.guild.roles.create({
        name: name,
        color: color.startsWith("#") ? color : `#${color}`,
        reason: `Created by ${message.author.tag}`,
      });

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:astrix:1539875362945900574> Role Created Successfully\n` +
              `-# *Successfully created new server role.* \n\n` +
              `> - **Role Name:** <@&${role.id}> (${role.name})\n` +
              `> - **Role ID:** \`${role.id}\`\n` +
              `> - **Color:** \`${role.hexColor}\``,
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
          `### <:red_star:1539875482680696834> Failed to Create Role\n` +
            `-# *${err.message || "An error occurred while creating the role."}*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }
  },
};
