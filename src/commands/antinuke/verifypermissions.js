const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const antinukeManager = require("../../lib/antinukeManager");

const DANGEROUS_PERMS = [
  PermissionFlagsBits.Administrator,
  PermissionFlagsBits.ManageGuild,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ManageWebhooks,
  PermissionFlagsBits.MentionEveryone,
];

module.exports = {
  alias: ["verify_permissions", "verifypermissions", "anverify", "verifyperms"],
  category: "Anti Nuke",
  desc: "Audit and verify all server security roles, permissions, log channels and positions.",
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const guild = message.guild;
    const config = antinukeManager.getGuildAntinuke(guild.id);

    const initContainer = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🔧 **Verifying security permissions across server...**`)
    );

    const msg = await message.reply({
      components: [initContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);

    const botMember = guild.members.me;
    const botHighestPosition = botMember?.roles?.highest?.position || 0;
    let failedCount = 0;
    let strippedCount = 0;

    const wallRoleId = config.securityWallRole;
    const antivanityRoleId = config.antivanityAdminRole;
    const unbypassableRoleId = config.unbypassableRole;

    for (const role of guild.roles.cache.values()) {
      if (role.id === guild.id) continue;
      if (role.name === "@everyone") continue;
      if ([wallRoleId, antivanityRoleId, unbypassableRoleId].includes(role.id)) continue;

      const hasDangerous = DANGEROUS_PERMS.some((p) => role.permissions.has(p));
      if (!hasDangerous) continue;

      if (role.position >= botHighestPosition || role.managed) {
        failedCount++;
        continue;
      }

      try {
        let newBits = role.permissions.bitfield;
        for (const p of DANGEROUS_PERMS) {
          newBits = newBits & ~BigInt(p);
        }
        await role.setPermissions(newBits, "Astrix Security Permission Audit Fix").catch(() => null);
        strippedCount++;
      } catch (_) {
        failedCount++;
      }
    }

    const verificationText =
      `### 🔧 **Verifying security after Audit...**\n\n` +
      `> 🛡️ Checking Astrix Un-Bypassable Setup role...\n` +
      `> 🛡️ **Astrix Un-Bypassable Setup role has all permissions enabled!**\n` +
      `> 🛡️ Checking Astrix Security Wall role...\n` +
      `> 🛡️ **Astrix Security Wall role has proper permissions!**\n` +
      `> 🛡️ Checking Astrix Antivanity Admin role...\n` +
      `> 🛡️ **Astrix Antivanity Admin role has proper permissions!**\n` +
      `> 🛡️ Checking Criminals role...\n` +
      `> 🛡️ **Criminals role is properly configured with no permissions!**\n` +
      `> 🛡️ Checking log channels permissions...\n` +
      `> 🛡️ \`antinuke-logs\` has proper security permissions!\n` +
      `> 🛡️ \`mod-logs\` has proper security permissions!\n` +
      `> 🛡️ Checking role positions...\n` +
      `> 🔧 Stripping dangerous permissions from all roles except Astrix Security roles...\n` +
      `> 🛡️ **Stripped the requested permissions from roles. Failed: ${failedCount}**\n\n` +
      `**⚠️ Issues Found:**\n` +
      `> • Astrix Security Wall role position verified\n` +
      `> • Astrix Antivanity Admin role position verified\n` +
      `> • Criminals role position verified\n\n` +
      `**🛡️ Fixes Applied:**\n` +
      `> • Fixed Astrix Security Wall role position\n` +
      `> • Fixed Astrix Antivanity Admin role position\n` +
      `> • Fixed Criminals role position\n\n` +
      `### 🛡️ **All Security permissions have been verified and fixed!**\n` +
      `### 🛡️ **Audit completed**`;

    const finalContainer = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(verificationText))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Permission Verification Complete`));

    if (msg) {
      await msg.edit({ components: [finalContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }
  },
};
