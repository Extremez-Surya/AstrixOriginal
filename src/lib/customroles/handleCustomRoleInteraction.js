const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const EMOJIS = require("../emojis");
const customRolesManager = require("../customRolesManager");

async function handleCustomRoleInteraction(client, interaction) {
  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "customrole_alias_select"
  ) {
    const selectedVal = interaction.values[0];
    if (!selectedVal || !selectedVal.startsWith("cr_inspect_")) {
      return false;
    }

    const parts = selectedVal.replace("cr_inspect_", "").split("_");
    const alias = parts[0];
    const roleId = parts[1];

    const role = interaction.guild.roles.cache.get(roleId);
    const crConfig = customRolesManager.getGuildConfig(client, interaction.guildId);
    const reqStr = crConfig.reqRole ? `<@&${crConfig.reqRole}>` : "`None` (Manage Roles)";

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# 🎭 Custom Role Alias Inspector\n` +
          `-# *Detailed configuration for trigger \`.${alias}\`*\n\n` +
          `### 📌 Alias Metadata\n` +
          `> - **Command Trigger:** \`.${alias} <@user>\`\n` +
          `> - **Target Role:** ${role ? `<@&${role.id}>` : "`Deleted Role`"}\n` +
          `> - **Role ID:** \`${roleId}\`\n` +
          `> - **ReqRole Security:** ${reqStr}\n` +
          `> - **Role Position:** \`#${role ? role.position : 0}\` (Highest: \`#${interaction.guild.members.me.roles.highest.position}\`)`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `-# *To assign/remove this role to a member, run: \`.${alias} @user\`*`
      )
    );

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    }).catch(() => null);

    return true;
  }

  return false;
}

module.exports = { handleCustomRoleInteraction };
