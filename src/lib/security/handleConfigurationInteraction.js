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
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
} = require("discord.js");
const configManager = require("../configManager");
const noprefixManager = require("../noprefixManager");
const EMOJIS = require("../emojis");

function buildConfigurationContainer(guild, authorUser) {
  const container = new ContainerBuilder();
  const config = configManager.getGuildConfig(guild.id);

  const triggerCount = config.triggers?.length || 0;
  const reactCount = config.reactionTriggers?.length || 0;
  const channelReactCount = config.channelReactions?.length || 0;

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `### ${EMOJIS.settings || "⚙️"} **ASTRIX SERVER CONFIGURATION CONTROL CENTER**`
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const statusText =
    `> - **Auto-Responders (Triggers):** \`${triggerCount}\` active\n` +
    `> - **Reaction Triggers (Auto-React):** \`${reactCount}\` active\n` +
    `> - **Channel Auto-Reactions:** \`${channelReactCount}\` channels configured\n` +
    `-# *Manage custom responses, automated emoji reactions, and channel auto-reactors.*`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(statusText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Creative Select Menu
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("config_select_menu")
    .setPlaceholder("⚙️ Select a server configuration directory...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("View Auto-Responders")
        .setValue("config_opt_list_triggers")
        .setDescription(`Directory of ${triggerCount} active auto-responder triggers`)
        .setEmoji("🤖"),
      new StringSelectMenuOptionBuilder()
        .setLabel("View Reaction Triggers")
        .setValue("config_opt_list_reactions")
        .setDescription(`Directory of ${reactCount} active auto-reaction triggers`)
        .setEmoji("😀"),
      new StringSelectMenuOptionBuilder()
        .setLabel("View Channel Auto-Reactions")
        .setValue("config_opt_list_channels")
        .setDescription(`Directory of ${channelReactCount} channel emoji reactors`)
        .setEmoji("📸"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Add New Trigger")
        .setValue("config_opt_add_trigger")
        .setDescription("Create a new auto-responder phrase & response card")
        .setEmoji("➕"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Add Reaction Trigger")
        .setValue("config_opt_add_reaction")
        .setDescription("Create a new keyword auto-emoji reaction")
        .setEmoji("➕"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Add Channel Auto-Reactions")
        .setValue("config_opt_add_channel_react")
        .setDescription("Set emojis to auto-react on every message in a channel")
        .setEmoji("➕"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Clear All Configurations")
        .setValue("config_opt_clear_all")
        .setDescription("Reset all triggers and auto-reactions for this server")
        .setEmoji("🧹")
    );

  const dropdownRow = new ActionRowBuilder().addComponents(selectMenu);

  // Direct Action Buttons
  const btnTriggers = new ButtonBuilder()
    .setCustomId("config_btn_triggers")
    .setLabel("Triggers")
    .setEmoji("🤖")
    .setStyle(ButtonStyle.Secondary);

  const btnReactions = new ButtonBuilder()
    .setCustomId("config_btn_reactions")
    .setLabel("Auto-React")
    .setEmoji("😀")
    .setStyle(ButtonStyle.Secondary);

  const btnChannels = new ButtonBuilder()
    .setCustomId("config_btn_channels")
    .setLabel("Channel React")
    .setEmoji("📸")
    .setStyle(ButtonStyle.Secondary);

  const buttonRow = new ActionRowBuilder().addComponents(btnTriggers, btnReactions, btnChannels);

  container.addActionRowComponents(dropdownRow, buttonRow);

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Hardened Configuration Engine`)
  );

  return container;
}

async function handleConfigurationInteraction(client, interaction) {
  const isBtn = interaction.isButton();
  const isMenu = interaction.isStringSelectMenu();
  const isModal = interaction.isModalSubmit();

  if (!isBtn && !isMenu && !isModal) return false;

  const customId = interaction.customId;
  if (!customId.startsWith("config_")) return false;

  // Permissions Check: Manage Server or Bot Owner
  const isMemberPermitted = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);
  const isBotOwner = noprefixManager.isOwner(interaction.user.id, client);

  if (!isMemberPermitted && !isBotOwner) {
    await interaction
      .reply({
        content: "❌ Access Denied: Manage Server permission required to edit configuration.",
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => null);
    return true;
  }

  const config = configManager.getGuildConfig(interaction.guild.id);

  // Direct Buttons
  if (isBtn) {
    if (customId === "config_btn_triggers") {
      return renderTriggersList(interaction, config);
    }
    if (customId === "config_btn_reactions") {
      return renderReactionsList(interaction, config);
    }
    if (customId === "config_btn_channels") {
      return renderChannelsList(interaction, config);
    }
  }

  // Select Menu
  if (isMenu && customId === "config_select_menu") {
    const selectedVal = interaction.values[0];

    if (selectedVal === "config_opt_list_triggers") {
      return renderTriggersList(interaction, config);
    }
    if (selectedVal === "config_opt_list_reactions") {
      return renderReactionsList(interaction, config);
    }
    if (selectedVal === "config_opt_list_channels") {
      return renderChannelsList(interaction, config);
    }

    if (selectedVal === "config_opt_add_trigger") {
      const modal = new ModalBuilder()
        .setCustomId("config_modal_add_trigger")
        .setTitle("🤖 Add New Auto-Responder Trigger")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("input_trigger")
              .setLabel("Trigger Phrase / Word")
              .setStyle(TextInputStyle.Short)
              .setPlaceholder("hello")
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("input_response")
              .setLabel("Response Message (Placeholders: {user}, {server})")
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder("Hello {user}! Welcome to {server}!")
              .setRequired(true)
          )
        );

      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selectedVal === "config_opt_add_reaction") {
      const modal = new ModalBuilder()
        .setCustomId("config_modal_add_reaction")
        .setTitle("😀 Add New Reaction Trigger")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("input_emoji")
              .setLabel("Emoji (e.g. 👍 or <:name:id>)")
              .setStyle(TextInputStyle.Short)
              .setPlaceholder("👍")
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("input_trigger")
              .setLabel("Trigger Phrase / Word")
              .setStyle(TextInputStyle.Short)
              .setPlaceholder("goodbye")
              .setRequired(true)
          )
        );

      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selectedVal === "config_opt_add_channel_react") {
      const modal = new ModalBuilder()
        .setCustomId("config_modal_add_channel_react")
        .setTitle("📸 Add Channel Auto-Reactions")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("input_channel")
              .setLabel("Channel Mention or ID")
              .setStyle(TextInputStyle.Short)
              .setValue(`<#${interaction.channel.id}>`)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("input_emojis")
              .setLabel("Emojis (space separated, e.g. 👍 ❤️ 🔥)")
              .setStyle(TextInputStyle.Short)
              .setPlaceholder("👍 ❤️")
              .setRequired(true)
          )
        );

      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selectedVal === "config_opt_clear_all") {
      config.triggers = [];
      config.reactionTriggers = [];
      config.channelReactions = [];
      configManager.setGuildConfig(interaction.guild.id, config);

      const updated = buildConfigurationContainer(interaction.guild, interaction.user);
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
  }

  // Modals
  if (isModal) {
    if (customId === "config_modal_add_trigger") {
      const trig = interaction.fields.getTextInputValue("input_trigger").trim();
      const resp = interaction.fields.getTextInputValue("input_response").trim();

      config.triggers.push({
        id: `trig_${Date.now()}`,
        trigger: trig,
        response: resp,
        matchMode: "includes",
        enabled: true,
        useComponentsV2: true,
      });

      configManager.setGuildConfig(interaction.guild.id, config);

      const updated = buildConfigurationContainer(interaction.guild, interaction.user);
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }

    if (customId === "config_modal_add_reaction") {
      const emoji = interaction.fields.getTextInputValue("input_emoji").trim();
      const trig = interaction.fields.getTextInputValue("input_trigger").trim();

      config.reactionTriggers.push({
        id: `react_${Date.now()}`,
        emoji,
        trigger: trig,
        matchMode: "includes",
      });

      configManager.setGuildConfig(interaction.guild.id, config);

      const updated = buildConfigurationContainer(interaction.guild, interaction.user);
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }

    if (customId === "config_modal_add_channel_react") {
      const chanInput = interaction.fields.getTextInputValue("input_channel").trim();
      const emojiInput = interaction.fields.getTextInputValue("input_emojis").trim();
      const channelId = chanInput.replace(/[^0-9]/g, "");

      const emojiArr = emojiInput.split(/\s+/).filter(Boolean);

      const idx = config.channelReactions.findIndex((item) => item.channelId === channelId);
      if (idx !== -1) {
        config.channelReactions[idx].emojis = emojiArr;
      } else {
        config.channelReactions.push({ channelId, emojis: emojiArr });
      }

      configManager.setGuildConfig(interaction.guild.id, config);

      const updated = buildConfigurationContainer(interaction.guild, interaction.user);
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
  }

  return false;
}

function renderTriggersList(interaction, config) {
  let listStr = "";
  if (!config.triggers || config.triggers.length === 0) {
    listStr = "*No auto-responder triggers configured yet.*";
  } else {
    config.triggers.forEach((t, i) => {
      listStr += `**#${i + 1} Trigger:** \`${t.trigger}\` • **Match:** \`${t.matchMode || "includes"}\`\n> **Response:** ${t.response}\n\n`;
    });
  }

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### 🤖 **AUTO-RESPONDER TRIGGERS DIRECTORY**`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(listStr))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Hardened Configuration Engine`));

  return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(() => null);
}

function renderReactionsList(interaction, config) {
  let listStr = "";
  if (!config.reactionTriggers || config.reactionTriggers.length === 0) {
    listStr = "*No auto-reaction triggers configured yet.*";
  } else {
    config.reactionTriggers.forEach((rt, i) => {
      listStr += `**#${i + 1} Emoji:** ${rt.emoji} • **Trigger:** \`${rt.trigger}\` • **Match:** \`${rt.matchMode || "includes"}\`\n`;
    });
  }

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### 😀 **REACTION TRIGGERS DIRECTORY**`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(listStr))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Hardened Configuration Engine`));

  return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(() => null);
}

function renderChannelsList(interaction, config) {
  let listStr = "";
  if (!config.channelReactions || config.channelReactions.length === 0) {
    listStr = "*No channel auto-reactions configured yet.*";
  } else {
    config.channelReactions.forEach((cr, i) => {
      listStr += `**#${i + 1} Channel:** <#${cr.channelId}> • **Emojis:** ${cr.emojis?.join(" ")}\n`;
    });
  }

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### 📸 **CHANNEL AUTO-REACTIONS DIRECTORY**`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(listStr))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Hardened Configuration Engine`));

  return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(() => null);
}

module.exports = {
  buildConfigurationContainer,
  handleConfigurationInteraction,
};
