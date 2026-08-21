const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const { getGuildConfig, setGuildConfig } = require("../../lib/starboardManager");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["starboardignore", "sbignore", "starignore"],
  category: "Starboard",
  desc: "Ignore or unignore specific channels or roles from triggering the starboard.",

  botPermissions: ["SendMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    const isPermitted =
      message.member?.permissions.has("ManageGuild") ||
      client.developer?.includes(message.author.id);

    if (!isPermitted) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Permission Denied\n` +
            `-# *You need the Manage Server permission to configure Starboard ignore list.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const config = getGuildConfig(message.guild.id);
    const action = args[0]?.toLowerCase();

    if (!action || action === "list") {
      const ignoredChans =
        config.ignoredChannels?.length > 0
          ? config.ignoredChannels.map((id) => `<#${id}>`).join(", ")
          : "`None`";
      const ignoredRoles =
        config.ignoredRoles?.length > 0
          ? config.ignoredRoles.map((id) => `<@&${id}>`).join(", ")
          : "`None`";

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🚫 Starboard Ignore Directory\n\n` +
              `> - **Ignored Channels:** ${ignoredChans}\n` +
              `> - **Ignored Roles:** ${ignoredRoles}\n\n` +
              `**Usage:**\n` +
              `> - \`.sbignore channel #channel\` — Toggle channel ignore\n` +
              `> - \`.sbignore role @role\` — Toggle role ignore`,
          ),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`-# *ASTRIXCODE™ Starboard Engine*`),
        );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    if (action === "channel" || action === "chan") {
      const channel =
        message.mentions.channels.first() ||
        message.guild.channels.cache.get(args[1]?.replace(/[<#>]/g, ""));

      if (!channel) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Channel Not Found\n` +
              `-# *Please specify a channel to toggle ignore status (e.g. \`.sbignore channel #nsfw\`).*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      let isAdded = false;
      if (config.ignoredChannels.includes(channel.id)) {
        config.ignoredChannels = config.ignoredChannels.filter((id) => id !== channel.id);
        isAdded = false;
      } else {
        config.ignoredChannels.push(channel.id);
        isAdded = true;
      }

      setGuildConfig(message.guild.id, config);

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🚫 Starboard Channel Filter Updated\n` +
            `> - **Channel:** <#${channel.id}>\n` +
            `> - **Status:** \`${isAdded ? "Ignored (Reactions will not trigger starboard)" : "Unignored (Reactions will trigger starboard)"}\``,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    if (action === "role") {
      const role =
        message.mentions.roles.first() ||
        message.guild.roles.cache.get(args[1]?.replace(/[<@&>]/g, "")) ||
        message.guild.roles.cache.find((r) => r.name.toLowerCase() === args.slice(1).join(" ").toLowerCase());

      if (!role) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Role Not Found\n` +
              `-# *Please specify a role to toggle ignore status (e.g. \`.sbignore role @Muted\`).*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      let isAdded = false;
      if (config.ignoredRoles.includes(role.id)) {
        config.ignoredRoles = config.ignoredRoles.filter((id) => id !== role.id);
        isAdded = false;
      } else {
        config.ignoredRoles.push(role.id);
        isAdded = true;
      }

      setGuildConfig(message.guild.id, config);

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🚫 Starboard Role Filter Updated\n` +
            `> - **Role:** <@&${role.id}>\n` +
            `> - **Status:** \`${isAdded ? "Ignored (Messages from members with this role are ignored)" : "Unignored"}\``,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }
  },
};
