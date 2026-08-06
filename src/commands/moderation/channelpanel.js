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
  alias: ["channelpanel", "cpanel"],
  category: "Moderation",
  desc: "Open the channel control console.",
  botPermissions: ["ManageChannels", "ManageMessages"],
  userPermissions: ["ManageChannels"],
  devOnly: false,

  async execute(client, message, args) {
    const channel = message.mentions.channels.first() || message.channel;
    const everyoneRole = message.guild.roles.everyone;

    const buildPanel = (
      statusMessage = "Select an operation from the options below.",
    ) => {
      const slowmode = channel.rateLimitPerUser || 0;
      const slowmodeText = slowmode === 0 ? "Off" : `${slowmode}s`;

      const content = [
        `### <:rshield:1528681364340080713> Channel Control Console: <#${channel.id}>`,
        `-# *Manage locking, visibility, slowmodes, and purging for this channel.*`,
        "",
        `> **Slowmode Duration:** \`${slowmodeText}\``,
        `> **System Message:** *${statusMessage}*`,
      ].join("\n");

      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("cp_lock")
          .setLabel("Lock")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("cp_unlock")
          .setLabel("Unlock")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("cp_hide")
          .setLabel("Hide")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("cp_unhide")
          .setLabel("Unhide")
          .setStyle(ButtonStyle.Primary),
      );

      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("cp_slow_0")
          .setLabel("Slow Off")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("cp_slow_5")
          .setLabel("Slow 5s")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("cp_slow_60")
          .setLabel("Slow 1m")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("cp_purge_10")
          .setLabel("Purge 10")
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
            `-# *<:astrix:1527205612205903973> Channel Management Console • Powered by ASTRIXCODE™ • © 2026*`,
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
      if (!i.member.permissions.has("ManageChannels")) {
        return i.reply({
          content: "You do not have permission to manage this channel.",
          flags: MessageFlags.Ephemeral,
        });
      }

      await i.deferUpdate().catch(() => null);
      let status = "Operation executed successfully.";

      try {
        switch (i.customId) {
          case "cp_lock":
            await channel.permissionOverwrites.edit(everyoneRole, {
              SendMessages: false,
            });
            status = "Channel successfully locked (SendMessages denied).";
            break;
          case "cp_unlock":
            await channel.permissionOverwrites.edit(everyoneRole, {
              SendMessages: null,
            });
            status = "Channel successfully unlocked (SendMessages reset).";
            break;
          case "cp_hide":
            await channel.permissionOverwrites.edit(everyoneRole, {
              ViewChannel: false,
            });
            status = "Channel successfully hidden (ViewChannel denied).";
            break;
          case "cp_unhide":
            await channel.permissionOverwrites.edit(everyoneRole, {
              ViewChannel: null,
            });
            status = "Channel successfully unhidden (ViewChannel reset).";
            break;
          case "cp_slow_0":
            await channel.setRateLimitPerUser(0);
            status = "Slowmode disabled.";
            break;
          case "cp_slow_5":
            await channel.setRateLimitPerUser(5);
            status = "Slowmode set to 5 seconds.";
            break;
          case "cp_slow_60":
            await channel.setRateLimitPerUser(60);
            status = "Slowmode set to 1 minute.";
            break;
          case "cp_purge_10":
            await channel.bulkDelete(10, true);
            status = "Purged last 10 messages.";
            break;
        }
      } catch (err) {
        status = `Error: ${err.message || String(err)}`;
      }

      const updated = buildPanel(status);
      await i
        .editReply({
          components: [updated],
          allowedMentions: { parse: [], repliedUser: false },
        })
        .catch(() => null);
    });

    collector.on("end", async () => {
      try {
        const content = [
          `### <:rshield:1528681364340080713> Channel Control Console: <#${channel.id}>`,
          `-# *Manage locking, visibility, slowmodes, and purging for this channel.*`,
          "",
          `*This panel has expired and is now inactive.*`,
        ].join("\n");

        const disabledPanel = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(content),
        );

        await replyMsg
          .edit({
            components: [disabledPanel],
            allowedMentions: { parse: [], repliedUser: false },
          })
          .catch(() => null);
      } catch (e) {}
    });
  },
};
