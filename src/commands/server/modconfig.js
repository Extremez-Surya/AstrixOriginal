const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const serverManager = require("../../lib/serverManager");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["modconfig", "moderationconfig", "modroles", "detainconfig"],
  category: "Server",
  desc: "Configure moderation roles, detain channels, and server moderation settings.",

  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const isOwner = message.author.id === message.guild.ownerId;
    const isAdmin = message.member.permissions.has("Administrator");

    if (!isOwner && !isAdmin) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Permission Denied\n` +
            `-# *Only the Server Owner or Administrators can configure server moderation settings.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const action = args[0]?.toLowerCase();

    if (!action || action === "view") {
      const config = serverManager.getServerConfig(message.guild.id);
      const mod = config.moderation;

      const formatRoles = (roleIds) => {
        if (!roleIds || !roleIds.length) return "`None`";
        return roleIds.map((id) => `<@&${id}>`).join(", ");
      };

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🛡️ Moderation Configuration • ${message.guild.name}\n` +
              `> - **Support Roles:** ${formatRoles(mod.supportRoles)}\n` +
              `> - **Mod Roles:** ${formatRoles(mod.modRoles)}\n` +
              `> - **Head Mod Roles:** ${formatRoles(mod.headmodRoles)}\n` +
              `> - **Detain Role:** ${mod.detainRole ? `<@&${mod.detainRole}>` : "`Not set`"}\n` +
              `> - **Detain Channel:** ${mod.detainChannel ? `<#${mod.detainChannel}>` : "`Not set`"}\n` +
              `> - **Detain Role Removal:** \`${mod.detainMode ? "Enabled (Strip Roles)" : "Disabled (Keep Roles)"}\`\n` +
              `> - **Disabled Notice:** \`${config.disableNotice !== false ? "Enabled" : "Disabled"}\``,
          ),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# *Usage: \`.modconfig set <support|mod|headmod|detainrole|detainchannel|detainmode> <value>\`*`,
          ),
        );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    if (action === "set") {
      const setting = args[1]?.toLowerCase();
      const validSettings = ["support", "mod", "headmod", "detainrole", "detainchannel", "detainmode"];

      if (!setting || !validSettings.includes(setting)) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:red_star:1539875482680696834> Invalid Setting\n` +
              `-# *Valid settings: \`support\`, \`mod\`, \`headmod\`, \`detainrole\`, \`detainchannel\`, \`detainmode\`*\n\n` +
              `> - **Example:** \`.modconfig set mod @Moderator\`\n` +
              `> - **Example:** \`.modconfig set detainchannel #mod-logs\``,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      const config = serverManager.getServerConfig(message.guild.id);

      if (setting === "detainchannel") {
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[2]?.replace(/[<#>]/g, ""));
        if (!channel || !channel.isTextBased()) {
          const container = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### <:red_star:1539875482680696834> Channel Not Found\n` +
                `-# *Please specify a valid text channel for detain notifications.*`,
            ),
          );
          return message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { parse: [], repliedUser: false },
          });
        }

        config.moderation.detainChannel = channel.id;
        serverManager.saveServerConfig(message.guild.id, config);

        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ✅ Detain Channel Configured\n` +
              `> - **Channel:** <#${channel.id}>\n` +
              `-# *Detain notifications will be forwarded to this channel.*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      if (setting === "detainmode") {
        const val = args[2]?.toLowerCase();
        const mode = val === "true" || val === "on" || val === "enable";
        config.moderation.detainMode = mode;
        serverManager.saveServerConfig(message.guild.id, config);

        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ✅ Detain Mode Updated\n` +
              `> - **Role Stripping:** \`${mode ? "Enabled (Roles removed on detain)" : "Disabled (Roles kept on detain)"}\`\n` +
              `-# *Setting has been saved for this server.*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      // Role settings: detainrole, support, mod, headmod
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[2]?.replace(/[<@&>]/g, "")) || message.guild.roles.cache.find((r) => r.name.toLowerCase() === args.slice(2).join(" ").toLowerCase());

      if (!role) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:red_star:1539875482680696834> Role Not Found\n` +
              `-# *Could not locate the specified role. Please mention the role or provide its ID.*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      if (setting === "detainrole") {
        config.moderation.detainRole = role.id;
        serverManager.saveServerConfig(message.guild.id, config);

        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ✅ Detain Role Set\n` +
              `> - **Detain Role:** <@&${role.id}>\n` +
              `-# *Members placed in detention will be assigned this role.*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      const fieldMap = {
        support: "supportRoles",
        mod: "modRoles",
        headmod: "headmodRoles",
      };

      const field = fieldMap[setting];
      let roles = config.moderation[field] || [];
      let isAdded = false;

      if (roles.includes(role.id)) {
        roles = roles.filter((id) => id !== role.id);
        isAdded = false;
      } else {
        roles.push(role.id);
        isAdded = true;
      }

      config.moderation[field] = roles;
      serverManager.saveServerConfig(message.guild.id, config);

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ✅ Role Configuration Updated\n` +
            `> - **Action:** \`${isAdded ? "Added" : "Removed"}\`\n` +
            `> - **Role:** <@&${role.id}>\n` +
            `> - **Category:** \`${setting.toUpperCase()}\`\n` +
            `-# *Permissions and bypasses updated.*`,
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
