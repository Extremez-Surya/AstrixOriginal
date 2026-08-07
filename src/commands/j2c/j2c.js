const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ChannelType,
} = require("discord.js");
const j2cManager = require("../../lib/j2cManager");
const { buildAstrixInterfacePayload } = require("../../lib/j2c/handleJ2CControlInteraction");

module.exports = {
  alias: ["j2c", "jointocreate", "j2cconfig"],
  category: "Join To Create",
  desc: "Configure and manage Join-To-Create dynamic voice channel generators.",
  botPermissions: ["ManageChannels", "MoveMembers", "SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const sub = args[0]?.toLowerCase();
    const config = j2cManager.getGuildJ2C(message.guild.id);

    if (sub === "setup") {
      const forceSetup = args[1]?.toLowerCase() === "force";

      if (!forceSetup && config.hubChannelId) {
        const existingHub = message.guild.channels.cache.get(config.hubChannelId);
        if (existingHub) {
          const existingInterface = config.interfaceTextChannelId
            ? message.guild.channels.cache.get(config.interfaceTextChannelId)
            : null;

          const container = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### ℹ️ J2C Setup Already Exists!\n` +
                `-# *Join-To-Create is already configured and active for this server.*\n\n` +
                `> - **Generator Hub:** <#${existingHub.id}>\n` +
                `> - **Interface Channel:** ${existingInterface ? `<#${existingInterface.id}>` : "`None`"}\n\n` +
                `*To force re-creation, run \`.j2c setup force\` or run \`.j2c reset\` first.*`
            )
          );
          return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
        }
      }

      try {
        const category = await message.guild.channels.create({
          name: "━━━ JOIN TO CREATE ━━━",
          type: ChannelType.GuildCategory,
          reason: "J2C System Automated Setup",
        });

        const textChannel = await message.guild.channels.create({
          name: "interface",
          type: ChannelType.GuildText,
          parent: category.id,
          reason: "J2C System Interface Channel",
        });

        const voiceHub = await message.guild.channels.create({
          name: "➕ Create VC",
          type: ChannelType.GuildVoice,
          parent: category.id,
          reason: "J2C System Generator Hub",
        });

        const interfacePayload = buildAstrixInterfacePayload("Astrix Interface");
        const interfaceMsg = await textChannel.send(interfacePayload);
        await interfaceMsg.pin().catch(() => null);

        j2cManager.setJ2CHub(message.guild.id, voiceHub.id, category.id);
        j2cManager.updateJ2CSettings(message.guild.id, {
          interfaceTextChannelId: textChannel.id,
          interfaceMessageId: interfaceMsg.id,
        });

        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🔊 Join-To-Create System Setup Complete!\n` +
              `-# *Automated category, interface channel, and generator hub created successfully.*\n\n` +
              `> - **Category:** <#${category.id}>\n` +
              `> - **Interface Text Channel:** <#${textChannel.id}>\n` +
              `> - **Generator Hub:** <#${voiceHub.id}>\n` +
              `> - **Interface Status:** Posted & Pinned in <#${textChannel.id}>`
          )
        );

        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      } catch (err) {
        console.error("[j2c] Error setting up J2C system:", err);
        return message.reply("❌ Failed to complete Join-To-Create setup. Please ensure bot has `Manage Channels` permission.").catch(() => null);
      }
    }

    if (sub === "reset") {
      j2cManager.resetJ2C(message.guild.id);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`✅ Join-To-Create system has been reset and disabled for this server.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (sub === "name" || sub === "template") {
      const templateStr = args.slice(1).join(" ");
      if (!templateStr) {
        return message.reply("❌ Provide a name template! Example: `.j2c name 🔊 {user}'s Room`").catch(() => null);
      }
      j2cManager.updateJ2CSettings(message.guild.id, { nameTemplate: templateStr });
      return message.reply(`✅ J2C room naming pattern set to: \`${templateStr}\``).catch(() => null);
    }

    if (sub === "limit") {
      const limit = parseInt(args[1]);
      if (isNaN(limit) || limit < 0 || limit > 99) {
        return message.reply("❌ Provide a valid user limit between 0 and 99! Example: `.j2c limit 5`").catch(() => null);
      }
      j2cManager.updateJ2CSettings(message.guild.id, { userLimit: limit });
      return message.reply(`✅ J2C temp room user limit set to: \`${limit === 0 ? "Unlimited" : limit}\``).catch(() => null);
    }

    // Default Overview / Help Card
    const hubStatus = config.hubChannelId ? `<#${config.hubChannelId}>` : "`Not Configured`";
    const activeTempCount = Object.keys(config.tempChannels || {}).length;

    const mainContent =
      `# 🔊 Join-To-Create (J2C) Dashboard\n` +
      `-# *Automatically generate temporary voice channels for members on join.*\n\n` +
      `### 📊 Active Configuration\n` +
      `> - **Generator Hub:** ${hubStatus}\n` +
      `> - **Interface Channel:** ${config.interfaceTextChannelId ? `<#${config.interfaceTextChannelId}>` : "`None`"}\n` +
      `> - **Naming Pattern:** \`${config.nameTemplate}\`\n` +
      `> - **User Limit:** \`${config.userLimit === 0 ? "Unlimited" : config.userLimit}\`\n` +
      `> - **Active Temp VCs:** \`${activeTempCount}\` room(s)\n\n` +
      `### 🛠️ Commands\n` +
      `> - \`.j2c setup\` or \`.j2csetup\` — Automated setup (Creates category, #interface & ➕ Create VC)\n` +
      `> - \`.j2c name <template>\` — Set temp room naming pattern (e.g. \`🔊 {user}'s Lounge\`)\n` +
      `> - \`.j2c limit <num>\` — Set user limit for temp VCs (0 = unlimited)\n` +
      `> - \`.j2c reset\` — Reset J2C system configuration`;

    const footerText = `-# ASTRIXCODE™ J2C Engine • © 2026 ASTRIXCODE`;

    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(mainContent))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText));

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
