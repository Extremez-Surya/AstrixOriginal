const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  alias: ["emergencypanel", "epanel", "emergency", "lockdownpanel"],
  category: "Moderation",
  desc: "Open the server emergency shutdown panel.",
  botPermissions: ["ManageChannels", "ManageMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const guild = message.guild;
    const everyoneRole = guild.roles.everyone;

    const buildPanel = (
      statusMessage = "Awaiting command deployment. Highly restricted control area.",
    ) => {
      const content = [
        `### <:Warn_red:1528691439658078290> Server Override Console: ${guild.name}`,
        `-# *Server-wide emergency lockdowns, channel purges, and slowmode configurations.*`,
        "",
        `> **Console Message:** *${statusMessage}*`,
      ].join("\n");

      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ep_lock_all")
          .setLabel("Lock All")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("ep_unlock_all")
          .setLabel("Unlock All")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("ep_hide_all")
          .setLabel("Hide All")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("ep_unhide_all")
          .setLabel("Unhide All")
          .setStyle(ButtonStyle.Primary),
      );

      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ep_slow_all_10")
          .setLabel("Slowmode All 10s")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("ep_purge_current_10")
          .setLabel("Purge 10 (Here)")
          .setStyle(ButtonStyle.Danger),
      );

      return new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# *<:astrix:1527205612205903973> Emergency Action Overrides • Powered by ASTRIXCODE™ • © 2026*`,
          ),
        )
        .addActionRowComponents(row1)
        .addActionRowComponents(row2);
    };

    const replyMsg = await message.reply({
      components: [buildPanel()],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });

    const collector = replyMsg.createMessageComponentCollector({
      time: 180000,
    });

    collector.on("collect", async (i) => {
      if (!i.member.permissions.has("Administrator")) {
        return i.reply({
          content:
            "You do not have Administrator permissions to deploy emergency overrides.",
          ephemeral: true,
        });
      }

      await i.deferUpdate();
      let status = "Emergency action executed.";

      try {
        const channels = guild.channels.cache.filter((c) => c.isTextBased());
        switch (i.customId) {
          case "ep_lock_all":
            for (const [id, ch] of channels) {
              await ch.permissionOverwrites
                .edit(everyoneRole, { SendMessages: false })
                .catch(() => {});
            }
            status = "Locked all text channels server-wide.";
            break;
          case "ep_unlock_all":
            for (const [id, ch] of channels) {
              await ch.permissionOverwrites
                .edit(everyoneRole, { SendMessages: null })
                .catch(() => {});
            }
            status = "Unlocked all text channels server-wide.";
            break;
          case "ep_hide_all":
            for (const [id, ch] of channels) {
              await ch.permissionOverwrites
                .edit(everyoneRole, { ViewChannel: false })
                .catch(() => {});
            }
            status = "Hided all text channels server-wide.";
            break;
          case "ep_unhide_all":
            for (const [id, ch] of channels) {
              await ch.permissionOverwrites
                .edit(everyoneRole, { ViewChannel: null })
                .catch(() => {});
            }
            status = "Unhided all text channels server-wide.";
            break;
          case "ep_slow_all_10":
            for (const [id, ch] of channels) {
              await ch.setRateLimitPerUser(10).catch(() => {});
            }
            status = "Enabled 10s slowmode on all text channels.";
            break;
          case "ep_purge_current_10":
            await message.channel.bulkDelete(10, true);
            status = "Purged last 10 messages in this channel.";
            break;
        }
      } catch (err) {
        status = `Error: ${err.message || String(err)}`;
      }

      const updated = buildPanel(status);
      await i.editReply({
        components: [updated],
        allowedMentions: { parse: [], repliedUser: false },
      });
    });

    collector.on("end", async () => {
      try {
        const content = [
          `### <:Warn_red:1528691439658078290> Server Override Console: ${guild.name}`,
          `-# *Server-wide emergency lockdowns, channel purges, and slowmode configurations.*`,
          "",
          `*This panel has expired and is now inactive.*`,
        ].join("\n");

        const disabledPanel = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(content),
        );

        await replyMsg.edit({
          components: [disabledPanel],
          allowedMentions: { parse: [], repliedUser: false },
        });
      } catch (e) {}
    });
  },
};
