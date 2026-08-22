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
const antinukeManager = require("../antinukeManager");
const EMOJIS = require("../emojis");

function buildAntinukeContainer(config) {
  const container = new ContainerBuilder();

  // Minimal Header
  const headerText = `### ${EMOJIS.antinuke || "🔒"} **Astrix Anti-Nuke Control Center**\n-# *Sub-0.1s Zero-Bypass Server Defense Engine*`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder()
      .setSpacing(SeparatorSpacingSize.Small)
      .setDivider(true)
  );

  // Status Summary
  const masterStatus = config.enabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`";
  const punishmentAction = (config.punishment || "ban").toUpperCase();
  const logChan = config.logChannel ? `<#${config.logChannel}>` : "`Disabled`";
  const revertStatus = config.enabled && config.autoRevert ? "🟢 `ACTIVE`" : "🔴 `OFF`";

  const isMod = (key) => (config.enabled && config.modules?.[key] ? "🟢" : "🔴");

  const channelMod = isMod("channel");
  const roleMod = isMod("role");
  const banMod = isMod("ban");
  const kickMod = isMod("kick");
  const botMod = isMod("botAdd");
  const webhookMod = isMod("webhook");
  const guildMod = isMod("guildUpdate");
  const emojiMod = isMod("emoji");
  const permsMod = isMod("permissions");

  const bodyText =
    `> - **Master Shield:** ${masterStatus} • **Punishment:** \`${punishmentAction}\`\n` +
    `> - **Auto-Revert Engine:** ${revertStatus} • **Audit Logs:** ${logChan}\n` +
    `> - **Extra Owners:** \`${(config.extraOwners || []).length}\` • **Whitelist:** \`${(config.whitelist || []).length}\` user(s)\n\n` +
    `**Active Protection Matrix:**\n` +
    `> ${channelMod} \`Channel\` | ${roleMod} \`Role\` | ${banMod} \`Anti-Ban\` | ${kickMod} \`Anti-Kick\`\n` +
    `> ${botMod} \`Rogue Bot\` | ${webhookMod} \`Webhook\` | ${guildMod} \`Vanity/Server\` | ${emojiMod} \`Emoji\`\n` +
    `> ${permsMod} \`Dangerous Perm Escalation Defense\`\n\n` +
    `⚡ **Intercepted Nukes:** \`${config.stats?.nukesIntercepted || 0}\` | **Reversions:** \`${config.stats?.reversionsExecuted || 0}\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(bodyText));

  container.addSeparatorComponents(
    new SeparatorBuilder()
      .setSpacing(SeparatorSpacingSize.Small)
      .setDivider(true)
  );

  // Creative Dropdown Select Menu
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("antinuke_select_menu")
    .setPlaceholder("⚙️ Select an Anti-Nuke defense module or policy...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(config.enabled ? "Disable Master Shield" : "Enable Master Shield")
        .setValue("antinuke_opt_toggle")
        .setDescription(config.enabled ? "Deactivate anti-nuke defense system" : "Activate master sub-0.1s anti-nuke defense")
        .setEmoji(config.enabled ? "🔴" : "🟢"),
      new StringSelectMenuOptionBuilder()
        .setLabel(`Change Punishment Policy (${punishmentAction})`)
        .setValue("antinuke_opt_punishment")
        .setDescription("Cycle action: BAN ➔ KICK ➔ STRIP ROLES ➔ TIMEOUT")
        .setEmoji("⚡"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Channel Defense Module")
        .setValue("antinuke_opt_channel")
        .setDescription(`Channel Create/Delete/Update (Currently: ${config.modules?.channel ? "ON" : "OFF"})`)
        .setEmoji("📁"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Role Defense Module")
        .setValue("antinuke_opt_role")
        .setDescription(`Role Create/Delete/Perms (Currently: ${config.modules?.role ? "ON" : "OFF"})`)
        .setEmoji("🎭"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Anti-Ban & Anti-Kick Module")
        .setValue("antinuke_opt_ban_kick")
        .setDescription("Mass Ban & Mass Kick Auto-Neutralization")
        .setEmoji("🚫"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Rogue Bot & Webhook Module")
        .setValue("antinuke_opt_webhook_bot")
        .setDescription("Rogue Bot Auto-Ban & Webhook Defense")
        .setEmoji("🤖"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Server & Vanity URL Defense")
        .setValue("antinuke_opt_guild")
        .setDescription(`Server Name, Vanity & Icon Shield (Currently: ${config.modules?.guildUpdate ? "ON" : "OFF"})`)
        .setEmoji("👑"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Emoji & Sticker Wipe Defense")
        .setValue("antinuke_opt_emoji")
        .setDescription(`Emoji & Sticker Deletion Defense (Currently: ${config.modules?.emoji ? "ON" : "OFF"})`)
        .setEmoji("🎨"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Auto-Revert Restoration Engine")
        .setValue("antinuke_opt_revert")
        .setDescription(`Automatically rebuild deleted channels/roles (Currently: ${config.autoRevert ? "ON" : "OFF"})`)
        .setEmoji("🔄"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Trust Directory & Whitelist")
        .setValue("antinuke_opt_whitelist")
        .setDescription("View immune whitelist and designated extra owners")
        .setEmoji("📋")
    );

  const menuRow = new ActionRowBuilder().addComponents(selectMenu);

  // Sleek Action Buttons
  const toggleBtn = new ButtonBuilder()
    .setCustomId("antinuke_toggle")
    .setLabel(config.enabled ? "Disable System" : "Enable System")
    .setStyle(config.enabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const actionBtn = new ButtonBuilder()
    .setCustomId("antinuke_cycle_action")
    .setLabel(`Action: ${punishmentAction}`)
    .setStyle(ButtonStyle.Primary);

  const revertBtn = new ButtonBuilder()
    .setCustomId("antinuke_toggle_revert")
    .setLabel(`Revert: ${config.autoRevert ? "ON" : "OFF"}`)
    .setStyle(config.autoRevert ? ButtonStyle.Secondary : ButtonStyle.Danger);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("antinuke_refresh")
    .setLabel("Refresh")
    .setStyle(ButtonStyle.Secondary);

  const buttonRow = new ActionRowBuilder().addComponents(toggleBtn, actionBtn, revertBtn, refreshBtn);

  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(buttonRow);

  const footerText = `-# ASTRIXCODE™ Security • Sub-0.1s Zero-Bypass Engine`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText));

  return container;
}

async function handleAntiNukeInteraction(client, interaction) {
  const isBtn = interaction.isButton();
  const isMenu = interaction.isStringSelectMenu();

  if (!isBtn && !isMenu) return false;

  const customId = interaction.customId;
  if (!customId.startsWith("antinuke_")) return false;

  if (!interaction.guild) return false;

  // Strict Permission Check: Only Guild Owner, Extra Owners, or Developers can configure anti-nuke
  const isOwner = interaction.guild.ownerId === interaction.user.id;
  const config = antinukeManager.getGuildAntinuke(interaction.guild.id);
  const isExtraOwner = (config.extraOwners || []).includes(interaction.user.id);
  const isDev = client.developer && Array.isArray(client.developer) && client.developer.includes(interaction.user.id);

  if (!isOwner && !isExtraOwner && !isDev) {
    await interaction
      .reply({
        content: "❌ Only the **Guild Owner** or designated **Extra Owners** can configure Anti-Nuke settings.",
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => null);
    return true;
  }

  const guildId = interaction.guild.id;

  // Handle StringSelectMenu Interactions
  if (isMenu && customId === "antinuke_select_menu") {
    const selected = interaction.values[0];

    if (selected === "antinuke_opt_toggle") {
      antinukeManager.toggleMaster(guildId);
    } else if (selected === "antinuke_opt_punishment") {
      const actions = ["ban", "kick", "strip", "timeout"];
      const nextIdx = (actions.indexOf(config.punishment || "ban") + 1) % actions.length;
      config.punishment = actions[nextIdx];
      antinukeManager.setGuildAntinuke(guildId, config);
    } else if (selected === "antinuke_opt_channel") {
      antinukeManager.toggleModule(guildId, "channel");
    } else if (selected === "antinuke_opt_role") {
      antinukeManager.toggleModule(guildId, "role");
    } else if (selected === "antinuke_opt_ban_kick") {
      antinukeManager.toggleModule(guildId, "ban");
      antinukeManager.toggleModule(guildId, "kick");
    } else if (selected === "antinuke_opt_webhook_bot") {
      antinukeManager.toggleModule(guildId, "webhook");
      antinukeManager.toggleModule(guildId, "botAdd");
    } else if (selected === "antinuke_opt_guild") {
      antinukeManager.toggleModule(guildId, "guildUpdate");
    } else if (selected === "antinuke_opt_emoji") {
      antinukeManager.toggleModule(guildId, "emoji");
    } else if (selected === "antinuke_opt_revert") {
      config.autoRevert = !config.autoRevert;
      antinukeManager.setGuildAntinuke(guildId, config);
    } else if (selected === "antinuke_opt_whitelist") {
      const wl = config.whitelist || [];
      const eo = config.extraOwners || [];

      const wlText = wl.length > 0 ? wl.map((id, i) => `\`${i + 1}.\` <@${id}> (\`${id}\`)`).join("\n") : "*No whitelisted users.*";
      const eoText = eo.length > 0 ? eo.map((id, i) => `\`${i + 1}.\` <@${id}> (\`${id}\`)`).join("\n") : "*No extra owners designated.*";

      const wlContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🔒 ANTI-NUKE TRUST DIRECTORY\n\n` +
              `👑 **Extra Server Owners:**\n${eoText}\n\n` +
              `📋 **Whitelisted Immune Users:**\n${wlText}`
          )
        );

      await interaction
        .reply({
          components: [wlContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return true;
    }

    const updated = buildAntinukeContainer(antinukeManager.getGuildAntinuke(guildId));
    await interaction
      .update({
        components: [updated],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
    return true;
  }

  // Handle Button Interactions
  if (customId === "antinuke_toggle") {
    antinukeManager.toggleMaster(guildId);
    const updated = buildAntinukeContainer(antinukeManager.getGuildAntinuke(guildId));
    await interaction
      .update({
        components: [updated],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
    return true;
  }

  if (customId === "antinuke_cycle_action") {
    const actions = ["ban", "kick", "strip", "timeout"];
    const nextIdx = (actions.indexOf(config.punishment || "ban") + 1) % actions.length;
    config.punishment = actions[nextIdx];
    antinukeManager.setGuildAntinuke(guildId, config);
    const updated = buildAntinukeContainer(config);
    await interaction
      .update({
        components: [updated],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
    return true;
  }

  if (customId === "antinuke_toggle_revert") {
    config.autoRevert = !config.autoRevert;
    antinukeManager.setGuildAntinuke(guildId, config);
    const updated = buildAntinukeContainer(config);
    await interaction
      .update({
        components: [updated],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
    return true;
  }

  if (customId === "antinuke_refresh") {
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const updated = buildAntinukeContainer(fresh);
    await interaction
      .update({
        components: [updated],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
    return true;
  }

  return false;
}

module.exports = {
  buildAntinukeContainer,
  handleAntiNukeInteraction,
};
