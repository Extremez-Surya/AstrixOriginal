const {
  ApplicationCommandType,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");
const customRolesManager = require("../../lib/customRolesManager");

function buildCustomRoleViewContainer(guild, crConfig) {
  const aliases = Object.entries(crConfig.aliases || {});
  const reqStatus = crConfig.reqRole ? `<@&${crConfig.reqRole}>` : "`None` (Manage Roles)";

  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `# 🎭 Custom Roles Control Dashboard\n` +
        `-# *Configure ultra-fast role shortcuts & alias triggers for ${guild.name}.*\n\n` +
        `### 📌 Status & Security\n` +
        `> - **Required Role:** ${reqStatus}\n` +
        `> - **Active Aliases:** \`${aliases.length}\` configured\n` +
        `> - **Anti-Bypass Protection:** \`ACTIVE 🛡️\``
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  if (aliases.length === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `*No custom role aliases configured yet.*\n` +
          `-# *Use \`/customrole add <alias> <role>\` to create your first shortcut.*`
      )
    );
  } else {
    const listLines = aliases.map(
      ([alias, roleId]) => `> -# **\` .${alias} \`** ➔ <@&${roleId}> (\`ID: ${roleId}\`)`
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 📋 Configured Role Aliases\n${listLines.join("\n")}`
      )
    );

    const selectOptions = aliases.slice(0, 25).map(([alias, roleId]) => {
      const role = guild.roles.cache.get(roleId);
      return new StringSelectMenuOptionBuilder()
        .setLabel(`Alias: .${alias}`)
        .setValue(`cr_inspect_${alias}_${roleId}`)
        .setDescription(`Role: ${role ? role.name : roleId}`)
        .setEmoji("🎭");
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("customrole_alias_select")
      .setPlaceholder("🔍 Select an alias to inspect...")
      .addOptions(selectOptions);

    const actionRow = new ActionRowBuilder().addComponents(selectMenu);
    container.addActionRowComponents(actionRow);
  }

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `-# *ASTRIXCODE™ High-Speed Engine • Response Time < 0.1s*`
    )
  );

  return container;
}

module.exports = {
  name: "customrole",
  description: "Configure and manage custom role shortcuts and alias triggers.",
  category: "Custom Roles",
  type: ApplicationCommandType.ChatInput,
  defaultMemberPermissions: PermissionFlagsBits.ManageRoles,
  botPermissions: ["ManageRoles"],
  userPermissions: ["ManageRoles"],

  others: {
    options: [
      {
        name: "view",
        description: "View the custom roles control panel and active aliases",
        type: 1,
      },
      {
        name: "add",
        description: "Create a new custom role alias shortcut",
        type: 1,
        options: [
          {
            name: "alias",
            description: "The shortcut name (e.g. vip)",
            type: 3,
            required: true,
          },
          {
            name: "role",
            description: "The role to trigger when alias is executed",
            type: 8,
            required: true,
          },
        ],
      },
      {
        name: "remove",
        description: "Delete an existing custom role alias shortcut",
        type: 1,
        options: [
          {
            name: "alias",
            description: "The shortcut alias to remove",
            type: 3,
            required: true,
          },
        ],
      },
      {
        name: "reqrole",
        description: "Set or disable the required role to trigger custom roles",
        type: 1,
        options: [
          {
            name: "role",
            description: "The required role (leave empty to disable)",
            type: 8,
            required: false,
          },
          {
            name: "disable",
            description: "Set to true to disable required role check",
            type: 5,
            required: false,
          },
        ],
      },
      {
        name: "reset",
        description: "Reset custom roles configuration for this server",
        type: 1,
      },
    ],
  },

  async execute(client, interaction) {
    const sub = interaction.options.getSubcommand();
    const crConfig = customRolesManager.getGuildConfig(client, interaction.guildId);
    const isAdminOrManager =
      interaction.member.permissions.has(PermissionFlagsBits.ManageGuild) ||
      interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (sub === "view") {
      const container = buildCustomRoleViewContainer(interaction.guild, crConfig);
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    if (!isAdminOrManager) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Permission Denied\n` +
            `-# *You need **Manage Server** or **Administrator** permission for custom role management.*`
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    if (sub === "add") {
      const alias = interaction.options.getString("alias").toLowerCase().trim();
      const role = interaction.options.getRole("role");

      if (customRolesManager.RESERVED_SUBCOMMANDS.includes(alias)) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.cross || "❌"} Reserved Word\n` +
              `-# *\`${alias}\` is a reserved system keyword and cannot be used as an alias.*`
          )
        );
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      if (customRolesManager.checkDangerousPermissions(role)) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🛡️ Security Block: Unsafe Role\n` +
              `-# *You cannot create aliases for roles with dangerous permissions (e.g., Admin, Manage Roles, etc).*`
          )
        );
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      const me = interaction.guild.members.me;
      if (role.position >= me.roles.highest.position) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.cross || "❌"} Hierarchy Error\n` +
              `-# *I cannot manage <@&${role.id}> because it is higher than or equal to my highest role.*`
          )
        );
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      customRolesManager.updateGuildConfig(client, interaction.guildId, (cfg) => {
        cfg.aliases = cfg.aliases || {};
        cfg.aliases[alias] = role.id;
        return cfg;
      });

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.tick || "✅"} Custom Role Alias Created\n` +
            `-# *Created shortcut \`.${alias}\` ➔ <@&${role.id}>*\n\n` +
            `> -# **Usage:** \`.${alias} <@user>\` to toggle role.`
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    if (sub === "remove") {
      const alias = interaction.options.getString("alias").toLowerCase().trim();

      if (!crConfig.aliases || !crConfig.aliases[alias]) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.cross || "❌"} Alias Not Found\n` +
              `-# *The custom role alias \`.${alias}\` does not exist.*`
          )
        );
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      customRolesManager.updateGuildConfig(client, interaction.guildId, (cfg) => {
        delete cfg.aliases[alias];
        return cfg;
      });

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.tick || "✅"} Alias Removed\n` +
            `-# *Successfully deleted custom role shortcut \`.${alias}\`.*`
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    if (sub === "reqrole") {
      const role = interaction.options.getRole("role");
      const disable = interaction.options.getBoolean("disable");

      if (disable || (!role && interaction.options.data[0]?.options?.length === 0)) {
        customRolesManager.updateGuildConfig(client, interaction.guildId, (cfg) => {
          cfg.reqRole = null;
          return cfg;
        });
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.tick || "✅"} ReqRole Disabled\n` +
              `-# *Custom role triggers now require standard **Manage Roles** permission.*`
          )
        );
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      if (role) {
        customRolesManager.updateGuildConfig(client, interaction.guildId, (cfg) => {
          cfg.reqRole = role.id;
          return cfg;
        });

        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.tick || "✅"} ReqRole Updated\n` +
              `-# *Members must now possess <@&${role.id}> (or Admin/Manage Server) to trigger role shortcuts.*`
          )
        );
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }
    }

    if (sub === "reset") {
      customRolesManager.updateGuildConfig(client, interaction.guildId, () => ({
        aliases: {},
        reqRole: null,
        antiBypass: true,
      }));

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.tick || "✅"} Custom Roles Reset\n` +
            `-# *Reset all custom role aliases and required role settings to default for this server.*`
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }
  },
};
