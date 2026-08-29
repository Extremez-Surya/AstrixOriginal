const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  ChannelType,
} = require("discord.js");
const embedManager = require("../../lib/embedManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Create, manage, and visually edit custom embeds with interactive studio")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    // 1. /embed create
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Create a new custom embed and open Interactive Studio")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Unique name for the embed (e.g. wlcm, rules)").setRequired(true)
        )
    )
    // 2. /embed list
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all saved custom embeds in this server")
    )
    // 3. /embed show
    .addSubcommand((sub) =>
      sub
        .setName("show")
        .setDescription("Preview a saved custom embed")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Name of the embed to preview").setRequired(true)
        )
    )
    // 4. /embed send
    .addSubcommand((sub) =>
      sub
        .setName("send")
        .setDescription("Dispatch a saved custom embed to a target channel")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Name of the embed to send").setRequired(true)
        )
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Channel where embed should be posted")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true)
        )
    )
    // 5. /embed delete
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Delete a saved custom embed")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Name of the embed to delete").setRequired(true)
        )
    )
    // 6. /embed reset
    .addSubcommand((sub) =>
      sub.setName("reset").setDescription("Reset and delete all custom embeds in this server")
    )
    // 7. /embed setcolor
    .addSubcommand((sub) =>
      sub
        .setName("setcolor")
        .setDescription("Set server default custom embed color")
        .addStringOption((opt) =>
          opt.setName("color").setDescription("Hex color code (e.g. #5865F2)").setRequired(true)
        )
    )
    // 8. /embed edit <subcommands>
    .addSubcommandGroup((group) =>
      group
        .setName("edit")
        .setDescription("Edit custom embed fields or launch visual studio")
        // edit all
        .addSubcommand((sub) =>
          sub
            .setName("all")
            .setDescription("Open interactive visual studio to preview and edit all embed fields at once")
            .addStringOption((opt) =>
              opt.setName("name").setDescription("Name of the embed to edit").setRequired(true)
            )
        )
        // edit title
        .addSubcommand((sub) =>
          sub
            .setName("title")
            .setDescription("Edit the title of an embed")
            .addStringOption((opt) =>
              opt.setName("name").setDescription("Embed name").setRequired(true)
            )
            .addStringOption((opt) =>
              opt.setName("title").setDescription("New title text").setRequired(true)
            )
        )
        // edit description
        .addSubcommand((sub) =>
          sub
            .setName("description")
            .setDescription("Edit the description of an embed")
            .addStringOption((opt) =>
              opt.setName("name").setDescription("Embed name").setRequired(true)
            )
            .addStringOption((opt) =>
              opt.setName("description").setDescription("New description text").setRequired(true)
            )
        )
        // edit color
        .addSubcommand((sub) =>
          sub
            .setName("color")
            .setDescription("Edit the border color of an embed")
            .addStringOption((opt) =>
              opt.setName("name").setDescription("Embed name").setRequired(true)
            )
            .addStringOption((opt) =>
              opt.setName("color").setDescription("Hex color code (e.g. #FF007F)").setRequired(true)
            )
        )
        // edit author
        .addSubcommand((sub) =>
          sub
            .setName("author")
            .setDescription("Edit the author header of an embed")
            .addStringOption((opt) =>
              opt.setName("name").setDescription("Embed name").setRequired(true)
            )
            .addStringOption((opt) =>
              opt.setName("author").setDescription("Author name").setRequired(true)
            )
            .addStringOption((opt) =>
              opt.setName("icon").setDescription("Author icon image URL").setRequired(false)
            )
        )
        // edit footer
        .addSubcommand((sub) =>
          sub
            .setName("footer")
            .setDescription("Edit the footer of an embed")
            .addStringOption((opt) =>
              opt.setName("name").setDescription("Embed name").setRequired(true)
            )
            .addStringOption((opt) =>
              opt.setName("footer").setDescription("Footer text").setRequired(true)
            )
            .addStringOption((opt) =>
              opt.setName("icon").setDescription("Footer icon image URL").setRequired(false)
            )
        )
        // edit image
        .addSubcommand((sub) =>
          sub
            .setName("image")
            .setDescription("Edit the large banner image URL")
            .addStringOption((opt) =>
              opt.setName("name").setDescription("Embed name").setRequired(true)
            )
            .addStringOption((opt) =>
              opt.setName("url").setDescription("Image URL").setRequired(true)
            )
        )
        // edit thumbnail
        .addSubcommand((sub) =>
          sub
            .setName("thumbnail")
            .setDescription("Edit the top-right thumbnail image URL")
            .addStringOption((opt) =>
              opt.setName("name").setDescription("Embed name").setRequired(true)
            )
            .addStringOption((opt) =>
              opt.setName("url").setDescription("Thumbnail URL").setRequired(true)
            )
        )
        // edit timestamp
        .addSubcommand((sub) =>
          sub
            .setName("timestamp")
            .setDescription("Enable or disable embed timestamp")
            .addStringOption((opt) =>
              opt.setName("name").setDescription("Embed name").setRequired(true)
            )
            .addBooleanOption((opt) =>
              opt.setName("enabled").setDescription("Enable timestamp").setRequired(true)
            )
        )
    ),

  async execute(client, interaction) {
    if (!interaction.guild) return;

    const guildId = interaction.guild.id;
    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();

    // 1. /embed create
    if (sub === "create") {
      const name = interaction.options.getString("name").toLowerCase().trim();

      if (embedManager.getEmbed(guildId, name)) {
        return interaction.reply({
          content: `⚠️ An embed named **\`${name}\`** already exists.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      embedManager.saveEmbed(guildId, name, {
        name,
        title: `Embed: ${name}`,
        description: "Click the buttons below to customize this embed!",
        color: embedManager.getGuildCustomColor(guildId),
      });

      const studioMsg = embedManager.buildEmbedStudioMessage(guildId, name, interaction.member, interaction.guild);
      return interaction.reply({
        ...studioMsg,
      });
    }

    // 2. /embed list
    if (sub === "list") {
      const listView = embedManager.buildEmbedListView(interaction.guild);
      return interaction.reply({
        components: [listView],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    // 3. /embed show
    if (sub === "show") {
      const name = interaction.options.getString("name").toLowerCase().trim();
      const embedData = embedManager.getEmbed(guildId, name);

      if (!embedData) {
        return interaction.reply({
          content: `❌ Embed **\`${name}\`** not found.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      const rendered = embedManager.renderEmbed(embedData, interaction.member, interaction.guild);
      return interaction.reply({
        embeds: [rendered],
      });
    }

    // 4. /embed send
    if (sub === "send") {
      const name = interaction.options.getString("name").toLowerCase().trim();
      const channel = interaction.options.getChannel("channel");
      const embedData = embedManager.getEmbed(guildId, name);

      if (!embedData) {
        return interaction.reply({
          content: `❌ Embed **\`${name}\`** not found.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      const rendered = embedManager.renderEmbed(embedData, interaction.member, interaction.guild);
      const sent = await channel.send({ embeds: [rendered] }).catch(() => null);

      if (sent) {
        return interaction.reply({
          content: `✅ Embed **\`${name}\`** dispatched to <#${channel.id}>!`,
          flags: MessageFlags.Ephemeral,
        });
      } else {
        return interaction.reply({
          content: `❌ Failed to send embed to <#${channel.id}>. Check bot permissions.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    // 5. /embed delete
    if (sub === "delete") {
      const name = interaction.options.getString("name").toLowerCase().trim();
      const deleted = embedManager.deleteEmbed(guildId, name);

      if (deleted) {
        return interaction.reply({
          content: `🗑️ Embed **\`${name}\`** has been deleted.`,
          flags: MessageFlags.Ephemeral,
        });
      } else {
        return interaction.reply({
          content: `❌ Embed **\`${name}\`** does not exist.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    // 6. /embed reset
    if (sub === "reset") {
      embedManager.resetGuildEmbeds(guildId);
      return interaction.reply({
        content: `🧹 All custom embeds for **${interaction.guild.name}** have been reset and deleted.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    // 7. /embed setcolor
    if (sub === "setcolor") {
      const color = interaction.options.getString("color");
      const cleanColor = embedManager.setGuildCustomColor(guildId, color);
      return interaction.reply({
        content: `🎨 Server custom embed color updated to **\`${cleanColor}\`**!`,
        flags: MessageFlags.Ephemeral,
      });
    }

    // 8. /embed edit <group>
    if (group === "edit") {
      const name = interaction.options.getString("name").toLowerCase().trim();
      let embedData = embedManager.getEmbed(guildId, name) || {
        name,
        title: `Embed: ${name}`,
        description: "Click the buttons below to customize this embed!",
        color: embedManager.getGuildCustomColor(guildId),
      };

      if (sub === "all") {
        const studioMsg = embedManager.buildEmbedStudioMessage(guildId, name, interaction.member, interaction.guild);
        return interaction.reply({
          ...studioMsg,
        });
      }

      if (sub === "title") embedData.title = interaction.options.getString("title");
      if (sub === "description") embedData.description = interaction.options.getString("description");
      if (sub === "color") embedData.color = interaction.options.getString("color");
      if (sub === "author") {
        embedData.authorName = interaction.options.getString("author");
        const icon = interaction.options.getString("icon");
        if (icon) embedData.authorIcon = icon;
      }
      if (sub === "footer") {
        embedData.footerText = interaction.options.getString("footer");
        const icon = interaction.options.getString("icon");
        if (icon) embedData.footerIcon = icon;
      }
      if (sub === "image") embedData.image = interaction.options.getString("url");
      if (sub === "thumbnail") embedData.thumbnail = interaction.options.getString("url");
      if (sub === "timestamp") embedData.timestamp = interaction.options.getBoolean("enabled");

      embedManager.saveEmbed(guildId, name, embedData);

      const studioMsg = embedManager.buildEmbedStudioMessage(guildId, name, interaction.member, interaction.guild);
      return interaction.reply({
        content: `✅ Updated **\`${sub}\`** for embed **\`${name}\`**!`,
        ...studioMsg,
      });
    }
  },
};
