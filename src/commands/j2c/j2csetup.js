const { ContainerBuilder, TextDisplayBuilder, MessageFlags, ChannelType, PermissionFlagsBits } = require("discord.js");
const j2cManager = require("../../lib/j2cManager");
const { buildAstrixInterfacePayload } = require("../../lib/j2c/handleJ2CControlInteraction");

module.exports = {
  alias: ["j2csetup", "jointocreatesetup"],
  category: "Join To Create",
  desc: "Automated Join-To-Create setup — creates category, #interface text channel & ➕ Create VC generator.",
  botPermissions: ["ManageChannels", "MoveMembers", "SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const existingConfig = j2cManager.getGuildJ2C(message.guild.id);
    const forceSetup = args[0]?.toLowerCase() === "force";

    if (!forceSetup && existingConfig.hubChannelId) {
      const existingHub = message.guild.channels.cache.get(existingConfig.hubChannelId);
      if (existingHub) {
        const existingInterface = existingConfig.interfaceTextChannelId
          ? message.guild.channels.cache.get(existingConfig.interfaceTextChannelId)
          : null;

        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ℹ️ J2C Setup Already Exists!\n` +
              `-# *Join-To-Create is already configured and active for this server.*\n\n` +
              `> - **Generator Hub:** <#${existingHub.id}>\n` +
              `> - **Interface Channel:** ${existingInterface ? `<#${existingInterface.id}>` : "`None`"}\n\n` +
              `*To force re-creation, run \`.j2csetup force\` or run \`.j2c reset\` first.*`
          )
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      }
    }

    try {
      // 1. Create Category Channel
      const category = await message.guild.channels.create({
        name: "━━━ JOIN TO CREATE ━━━",
        type: ChannelType.GuildCategory,
        reason: "J2C System Automated Setup",
      });

      // 2. Create Text Channel (#interface)
      const textChannel = await message.guild.channels.create({
        name: "interface",
        type: ChannelType.GuildText,
        parent: category.id,
        reason: "J2C System Interface Channel",
      });

      // 3. Create Voice Hub Channel (➕ Create VC)
      const voiceHub = await message.guild.channels.create({
        name: "➕ Create VC",
        type: ChannelType.GuildVoice,
        parent: category.id,
        reason: "J2C System Generator Hub",
      });

      // 4. Build and Send Astrix Interface into #interface
      const interfacePayload = buildAstrixInterfacePayload("Astrix Interface");
      const interfaceMsg = await textChannel.send(interfacePayload);
      await interfaceMsg.pin().catch(() => null);

      // 5. Save Configuration to j2cManager
      j2cManager.setJ2CHub(message.guild.id, voiceHub.id, category.id);
      j2cManager.updateJ2CSettings(message.guild.id, {
        interfaceTextChannelId: textChannel.id,
        interfaceMessageId: interfaceMsg.id,
      });

      // 6. Confirmation Reply
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
      console.error("[j2csetup] Error setting up J2C system:", err);
      return message.reply("❌ Failed to complete Join-To-Create setup. Please ensure bot has `Manage Channels` permission.").catch(() => null);
    }
  },
};
