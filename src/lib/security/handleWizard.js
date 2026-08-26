const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageFlags,
} = require("discord.js");
const antinukeManager = require("../antinukeManager");
const { executeAutoSetup } = require("./handleAutoSetup");

/**
 * Builds the interactive 1-Click / Step-by-Step Antinuke Setup Wizard
 */
function buildWizardContainer(guild, authorUser, currentStep = "step1", wizardState = {}) {
  const container = new ContainerBuilder();
  const config = antinukeManager.getGuildAntinuke(guild.id);

  if (currentStep === "step1") {
    const headerText =
      `### 🧙‍♂️ **Astrix Anti-Nuke • Interactive Setup Wizard (Step 1/3)**\n` +
      `-# Tailor your server's security profile, defense thresholds, and punishment policies.\n\n` +
      `**Choose a Security Profile below to begin:**\n\n` +
      `> 🛡️ **Recommended (Balanced)**\n` +
      `> • *3-Strike threshold within 60s window*\n` +
      `> • *Default Action:* \`BAN\` • *Auto-Revert:* \`ENABLED\`\n` +
      `> • *Best for active community and gaming servers.*\n\n` +
      `> ⚡ **Hardcore (Zero-Tolerance Lockdown)**\n` +
      `> • *1-Strike instant intervention (Zero tolerance)*\n` +
      `> • *Default Action:* \`BAN\` • *Auto-Revert:* \`ENABLED\`\n` +
      `> • *Best for large public or high-target servers.*\n\n` +
      `> 🌱 **Relaxed (Moderate Supervision)**\n` +
      `> • *5-Strike threshold within 60s window*\n` +
      `> • *Default Action:* \`KICK\` • *Auto-Revert:* \`ENABLED\`\n` +
      `> • *Best for smaller private community servers.*`;

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    const presetMenu = new StringSelectMenuBuilder()
      .setCustomId("antinuke_wizard_select_preset")
      .setPlaceholder("🎯 Select a Security Defense Profile...")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Recommended (Balanced 3-Strike Ban)")
          .setValue("wizard_preset_recommended")
          .setDescription("Optimal balance of security and admin freedom")
          .setEmoji("🛡️"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Hardcore (1-Strike Instant Ban)")
          .setValue("wizard_preset_hardcore")
          .setDescription("Zero-tolerance extreme anti-raid lockdown")
          .setEmoji("⚡"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Relaxed (5-Strike Moderate Kick)")
          .setValue("wizard_preset_relaxed")
          .setDescription("Gentle supervision for private friend servers")
          .setEmoji("🌱")
      );

    const menuRow = new ActionRowBuilder().addComponents(presetMenu);

    const btnQuickRecommended = new ButtonBuilder()
      .setCustomId("antinuke_wizard_apply_recommended")
      .setLabel("1-Click Recommended")
      .setEmoji("🚀")
      .setStyle(ButtonStyle.Success);

    const btnCancel = new ButtonBuilder()
      .setCustomId("antinuke_wizard_cancel")
      .setLabel("Cancel")
      .setEmoji("❌")
      .setStyle(ButtonStyle.Danger);

    const btnRow = new ActionRowBuilder().addComponents(btnQuickRecommended, btnCancel);

    container.addActionRowComponents(menuRow);
    container.addActionRowComponents(btnRow);
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Interactive Setup Wizard`));
    return container;
  }

  if (currentStep === "step2") {
    const selectedPreset = wizardState.preset || "recommended";
    const headerText =
      `### 🧙‍♂️ **Astrix Anti-Nuke • Interactive Setup Wizard (Step 2/3)**\n` +
      `-# Profile Selected: **${selectedPreset.toUpperCase()}**\n\n` +
      `**Choose Default Punishment for Rogue Violators:**\n\n` +
      `> 🔨 **Instant Ban:** Permanently bans rogue actors & purges their actions.\n` +
      `> 👢 **Instant Kick:** Removes the rogue user/bot from the server.\n` +
      `> 🚫 **Strip Roles:** Strips all manageable roles to instantly revoke permissions.\n` +
      `> ⏳ **28-Day Timeout:** Locks down the violator for 28 days.\n` +
      `> 🔒 **Quarantine:** Moves violator to Criminals role with 0 permissions.`;

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    const punishmentMenu = new StringSelectMenuBuilder()
      .setCustomId(`antinuke_wizard_select_punishment_${selectedPreset}`)
      .setPlaceholder("⚖️ Select Punishment Enforcement...")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Ban Violator (Recommended)")
          .setValue("punish_ban")
          .setDescription("Permanently ban rogue actors")
          .setEmoji("🔨"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Kick Violator")
          .setValue("punish_kick")
          .setDescription("Remove rogue actor from server")
          .setEmoji("👢"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Strip Dangerous Roles")
          .setValue("punish_strip")
          .setDescription("Instantly revoke all manageable permissions")
          .setEmoji("🚫"),
        new StringSelectMenuOptionBuilder()
          .setLabel("28-Day Security Timeout")
          .setValue("punish_timeout")
          .setDescription("Mute and timeout the rogue account")
          .setEmoji("⏳"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Criminals Quarantine")
          .setValue("punish_quarantine")
          .setDescription("Isolate in quarantine role")
          .setEmoji("🔒")
      );

    const menuRow = new ActionRowBuilder().addComponents(punishmentMenu);

    const btnBack = new ButtonBuilder()
      .setCustomId("antinuke_wizard_back_step1")
      .setLabel("Back")
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Secondary);

    const btnCancel = new ButtonBuilder()
      .setCustomId("antinuke_wizard_cancel")
      .setLabel("Cancel")
      .setEmoji("❌")
      .setStyle(ButtonStyle.Danger);

    const btnRow = new ActionRowBuilder().addComponents(btnBack, btnCancel);

    container.addActionRowComponents(menuRow);
    container.addActionRowComponents(btnRow);
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Step 2/3`));
    return container;
  }

  if (currentStep === "step3") {
    const selectedPreset = wizardState.preset || "recommended";
    const selectedPunish = wizardState.punishment || "ban";
    const headerText =
      `### 🧙‍♂️ **Astrix Anti-Nuke • Review & Deploy (Step 3/3)**\n` +
      `-# Review your custom defense configuration before automated deployment.\n\n` +
      `**🛡️ Deployment Summary:**\n` +
      `> • **Security Profile:** \`${selectedPreset.toUpperCase()}\`\n` +
      `> • **Default Punishment:** \`${selectedPunish.toUpperCase()}\`\n` +
      `> • **Defense Modules:** \`ALL 10 MODULES ARMED\`\n` +
      `> • **Auto-Revert:** \`ENABLED (Sub-0.1s Restoration)\`\n\n` +
      `**🏗️ Infrastructure Deployed on Activation:**\n` +
      `> • 🟡 **Astrix Bypass Role:** Created at Top for whitelisted staff.\n` +
      `> • 🟢 **Astrix Un-Bypassable Setup Role:** Created at Top for root engine.\n` +
      `> • 🔵 **Astrix Security Wall Role:** Created at Bottom & assigned to everyone.\n` +
      `> • 🔴 **Criminals Quarantine Role:** Created at Bottom for violators.\n` +
      `> • 📁 **Dedicated Security Category & Log Channels:** \`#antinuke-logs\`, \`#mod-logs\` etc.\n\n` +
      `*Click **Deploy & Hardened Defense** to activate protection and complete automatic hardening.*`;

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    const btnDeploy = new ButtonBuilder()
      .setCustomId(`antinuke_wizard_deploy_${selectedPreset}_${selectedPunish}`)
      .setLabel("Deploy & Harden Defense")
      .setEmoji("🚀")
      .setStyle(ButtonStyle.Success);

    const btnBack = new ButtonBuilder()
      .setCustomId(`antinuke_wizard_back_step2_${selectedPreset}`)
      .setLabel("Back")
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Secondary);

    const btnCancel = new ButtonBuilder()
      .setCustomId("antinuke_wizard_cancel")
      .setLabel("Cancel")
      .setEmoji("❌")
      .setStyle(ButtonStyle.Danger);

    const btnRow = new ActionRowBuilder().addComponents(btnDeploy, btnBack, btnCancel);

    container.addActionRowComponents(btnRow);
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Ready to Deploy`));
    return container;
  }

  return container;
}

/**
 * Handles all wizard interactions
 */
async function handleWizardInteraction(interaction, client) {
  const { customId, guild, user } = interaction;
  const isStringMenu = interaction.isStringSelectMenu();

  if (isStringMenu && customId === "antinuke_wizard_select_preset") {
    const val = interaction.values[0];
    const preset = val.replace("wizard_preset_", "");
    const view = buildWizardContainer(guild, user, "step2", { preset });
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (isStringMenu && customId.startsWith("antinuke_wizard_select_punishment_")) {
    const preset = customId.replace("antinuke_wizard_select_punishment_", "");
    const val = interaction.values[0];
    const punishment = val.replace("punish_", "");
    const view = buildWizardContainer(guild, user, "step3", { preset, punishment });
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_wizard_apply_recommended") {
    antinukeManager.applyPreset(guild.id, "recommended");
    await executeAutoSetup(guild, user, "create_new_wall", interaction);
    return true;
  }

  if (customId.startsWith("antinuke_wizard_deploy_")) {
    const parts = customId.replace("antinuke_wizard_deploy_", "").split("_");
    const preset = parts[0] || "recommended";
    const punishment = parts[1] || "ban";

    const cfg = antinukeManager.applyPreset(guild.id, preset);
    cfg.punishment = punishment;
    antinukeManager.setGuildAntinuke(guild.id, cfg);

    await executeAutoSetup(guild, user, "create_new_wall", interaction);
    return true;
  }

  if (customId === "antinuke_wizard_back_step1") {
    const view = buildWizardContainer(guild, user, "step1");
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId.startsWith("antinuke_wizard_back_step2_")) {
    const preset = customId.replace("antinuke_wizard_back_step2_", "");
    const view = buildWizardContainer(guild, user, "step2", { preset });
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_wizard_cancel") {
    const { buildAntinukeContainer } = require("./handleAntiNukeInteraction");
    const fresh = antinukeManager.getGuildAntinuke(guild.id);
    const view = buildAntinukeContainer(fresh, guild, "home");
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  return false;
}

module.exports = {
  buildWizardContainer,
  handleWizardInteraction,
};
