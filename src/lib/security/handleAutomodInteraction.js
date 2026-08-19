const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const automodManager = require("../automodManager");
const EMOJIS = require("../emojis");

function buildAutomodContainer(config) {
  const container = new ContainerBuilder();

  // Minimal Header
  const headerText = `### ${EMOJIS.automod || "🤖"} **Astrix AutoMod Control Center**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder()
      .setSpacing(SeparatorSpacingSize.Small)
      .setDivider(true)
  );

  // Status Summary
  const masterStatus = config.enabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`";
  const activePreset = config.activePreset
    ? `\`${config.activePreset.charAt(0).toUpperCase() + config.activePreset.slice(1)}\``
    : "`Custom`";
  const logChan = config.logChannel ? `<#${config.logChannel}>` : "`None`";

  const enabledCount = config.enabled
    ? Object.values(config.modules || {}).filter((m) => m.enabled).length
    : 0;
  const totalCount = Object.keys(automodManager.MODULES).length;

  const isMod = (key) => (config.enabled && config.modules?.[key]?.enabled ? "🟢" : "🔴");

  const bodyText =
    `> - **Master System:** ${masterStatus} • **Preset:** ${activePreset}\n` +
    `> - **Active Filters:** \`${enabledCount}/${totalCount}\` modules • **Log Channel:** ${logChan}\n` +
    `> - **Strike Enforcement:** \`${config.strikesEnabled ? "ENABLED" : "DISABLED"}\` (\`${config.strikeExpiry || 24}h\` expiry)\n\n` +
    `**Active Protection Modules:**\n` +
    `> ${isMod("antiinvite")} **Anti-Invite** | ${isMod("antilink")} **Anti-Link** | ${isMod("antispam")} **Anti-Spam**\n` +
    `> ${isMod("anticaps")} **Anti-Caps** | ${isMod("antimention")} **Anti-Mention** | ${isMod("badwords")} **Bad Words**\n` +
    `> ${isMod("antieveryone")} **Anti-Everyone** | ${isMod("antirole")} **Anti-Role** | ${isMod("antizalgo")} **Anti-Zalgo**\n` +
    `> ${isMod("antiai")} **AI Toxicity Check** | ⚡ **Violations Intercepted:** \`${config.stats?.violationsIntercepted || 0}\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(bodyText));

  container.addSeparatorComponents(
    new SeparatorBuilder()
      .setSpacing(SeparatorSpacingSize.Small)
      .setDivider(true)
  );

  // Creative Dropdown Select Menu
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("automod_select_menu")
    .setPlaceholder("⚙️ Select an automod preset, module or setting...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(config.enabled ? "Disable Master System" : "Enable Master System")
        .setValue("automod_opt_toggle")
        .setDescription(config.enabled ? "Turn off automod system" : "Turn on automod system")
        .setEmoji(config.enabled ? "🔴" : "🟢"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Apply Strict Protection Preset")
        .setValue("automod_opt_preset_strict")
        .setDescription("Maximum security - enables all 14 automod protection modules")
        .setEmoji("🔒"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Apply Moderate Protection Preset")
        .setValue("automod_opt_preset_moderate")
        .setDescription("Balanced protection for standard community servers")
        .setEmoji("⚖️"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Apply Light Protection Preset")
        .setValue("automod_opt_preset_light")
        .setDescription("Basic protection - anti-invite, anti-everyone & anti-spam")
        .setEmoji("🪶"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Toggle Protection Modules")
        .setValue("automod_opt_modules")
        .setDescription("Configure individual module toggles")
        .setEmoji("📦"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Bad Words Filter Directory")
        .setValue("automod_opt_badwords")
        .setDescription(`Manage banned words list (${config.modules?.badwords?.words?.length || 0} words)`)
        .setEmoji("🤬"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Ignore Rules & Bypasses")
        .setValue("automod_opt_ignore")
        .setDescription("Configure channel, role, and user ignores")
        .setEmoji("🚫")
    );

  const menuRow = new ActionRowBuilder().addComponents(selectMenu);

  // Minimal Buttons
  const toggleBtn = new ButtonBuilder()
    .setCustomId("automod_toggle")
    .setLabel(config.enabled ? "Disable" : "Enable")
    .setStyle(config.enabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const strictBtn = new ButtonBuilder()
    .setCustomId("automod_preset_strict")
    .setLabel("Strict")
    .setStyle(config.activePreset === "strict" ? ButtonStyle.Success : ButtonStyle.Secondary);

  const moderateBtn = new ButtonBuilder()
    .setCustomId("automod_preset_moderate")
    .setLabel("Moderate")
    .setStyle(config.activePreset === "moderate" ? ButtonStyle.Success : ButtonStyle.Secondary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("automod_refresh")
    .setLabel("Refresh")
    .setStyle(ButtonStyle.Secondary);

  const buttonRow = new ActionRowBuilder().addComponents(toggleBtn, strictBtn, moderateBtn, refreshBtn);

  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(buttonRow);

  const footerText = `-# ASTRIXCODE™ AutoMod Engine • Sub-0.1s Unbypassable Protection`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText));

  return container;
}

function buildModuleSelectContainer(config) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 📦 **AUTOMOD MODULE TOGGLES**\nSelect modules to toggle on or off:`)
    );

  const options = Object.entries(automodManager.MODULES).map(([key, mod]) => {
    const isEnabled = config.enabled && config.modules?.[key]?.enabled;
    return new StringSelectMenuOptionBuilder()
      .setLabel(mod.name)
      .setValue(`automod_mod_toggle_${key}`)
      .setDescription(mod.description)
      .setEmoji(isEnabled ? "🟢" : "🔴");
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId("automod_module_toggle_select")
    .setPlaceholder("Select module to toggle...")
    .addOptions(options.slice(0, 14));

  container.addActionRowComponents(new ActionRowBuilder().addComponents(select));
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("automod_back_main").setLabel("Back to Control Panel").setStyle(ButtonStyle.Secondary)
    )
  );

  return container;
}

async function handleAutomodInteraction(client, interaction) {
  const isBtn = interaction.isButton();
  const isMenu = interaction.isStringSelectMenu();

  if (!isBtn && !isMenu) return false;

  const customId = interaction.customId;
  if (!customId.startsWith("automod_")) return false;

  if (!interaction.guild) return false;

  // Permissions Check: Manage Server required
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    await interaction
      .reply({
        content: "❌ You need **Manage Server** permission to configure AutoMod settings.",
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => null);
    return true;
  }

  const guildId = interaction.guild.id;
  const config = automodManager.getGuildAutomod(guildId);

  // Handle StringSelectMenu Interactions
  if (isMenu && customId === "automod_select_menu") {
    const selected = interaction.values[0];

    if (selected === "automod_opt_toggle") {
      automodManager.toggleMaster(guildId);
    } else if (selected === "automod_opt_preset_strict") {
      automodManager.applyPreset(guildId, "strict");
    } else if (selected === "automod_opt_preset_moderate") {
      automodManager.applyPreset(guildId, "moderate");
    } else if (selected === "automod_opt_preset_light") {
      automodManager.applyPreset(guildId, "light");
    } else if (selected === "automod_opt_modules") {
      const modContainer = buildModuleSelectContainer(config);
      await interaction
        .update({
          components: [modContainer],
          flags: MessageFlags.IsComponentsV2,
        })
        .catch(() => null);
      return true;
    } else if (selected === "automod_opt_badwords") {
      const words = config.modules?.badwords?.words || [];
      const listText = words.length > 0 ? words.map((w, i) => `\`${i + 1}.\` ||${w}||`).join("\n") : "*No banned words configured.*";
      const badwordsContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### 🤬 **BAD WORDS DIRECTORY**\n\n**Total Banned Words:** \`${words.length}\`\n\n${listText}`)
      );
      await interaction
        .reply({
          components: [badwordsContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return true;
    } else if (selected === "automod_opt_ignore") {
      const ign = config.ignore || { channels: [], roles: [], users: [] };
      const chansText = ign.channels.length > 0 ? ign.channels.map((id) => `<#${id}>`).join(", ") : "*None*";
      const rolesText = ign.roles.length > 0 ? ign.roles.map((id) => `<@&${id}>`).join(", ") : "*None*";
      const usersText = ign.users.length > 0 ? ign.users.map((id) => `<@${id}>`).join(", ") : "*None*";

      const ignoreContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🚫 **AUTOMOD IGNORE RULES**\n\n` +
            `> - **Ignored Channels:** ${chansText}\n` +
            `> - **Ignored Roles:** ${rolesText}\n` +
            `> - **Ignored Users:** ${usersText}`
        )
      );
      await interaction
        .reply({
          components: [ignoreContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return true;
    }

    const updated = buildAutomodContainer(automodManager.getGuildAutomod(guildId));
    await interaction
      .update({
        components: [updated],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
    return true;
  }

  // Handle Module Toggle Select Menu
  if (isMenu && customId === "automod_module_toggle_select") {
    const selectedVal = interaction.values[0];
    const modKey = selectedVal.replace("automod_mod_toggle_", "");

    automodManager.toggleModule(guildId, modKey);

    const updatedModContainer = buildModuleSelectContainer(automodManager.getGuildAutomod(guildId));
    await interaction
      .update({
        components: [updatedModContainer],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
    return true;
  }

  // Handle Buttons
  if (customId === "automod_toggle") {
    automodManager.toggleMaster(guildId);
  } else if (customId === "automod_preset_strict") {
    automodManager.applyPreset(guildId, "strict");
  } else if (customId === "automod_preset_moderate") {
    automodManager.applyPreset(guildId, "moderate");
  } else if (customId === "automod_back_main" || customId === "automod_refresh") {
    // Just refresh back to main panel
  }

  const updatedMain = buildAutomodContainer(automodManager.getGuildAutomod(guildId));
  await interaction
    .update({
      components: [updatedMain],
      flags: MessageFlags.IsComponentsV2,
    })
    .catch(() => null);
  return true;
}

module.exports = {
  buildAutomodContainer,
  handleAutomodInteraction,
};
