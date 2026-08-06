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
const afkManager = require("../../lib/afkManager");

module.exports = {
  alias: ["afk"],
  category: "Information",
  desc: "Set your Away From Keyboard (AFK) status.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const reason = args.join(" ") || "None specified";

    const promptContainer = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:Sleepy:1528993260713017377> Choose AFK Scope: ${message.author.username}\n` +
            `-# *Select whether you want to be marked as AFK globally or only in this server.*\n\n` +
            `> <:list:1528313871889334382> **Reason:** \`${reason}\``,
        ),
      )
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("afk_global")
            .setEmoji("<:server:1528311049726591006>")
            .setLabel("Global AFK")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("afk_server")
            .setEmoji("<:website:1528304906400960582>")
            .setLabel("Server AFK")
            .setStyle(ButtonStyle.Success),
        ),
      );

    const replyMsg = await message.reply({
      components: [promptContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });

    const filter = (i) => i.user.id === message.author.id;
    const collector = replyMsg.createMessageComponentCollector({
      filter,
      time: 30000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();
      const isGlobal = i.customId === "afk_global";

      afkManager.setAFK(
        message.author.id,
        message.author.username,
        reason,
        isGlobal,
        message.guild.id,
      );

      const confirmContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:Sleepy:1528993260713017377> AFK Status Enabled\n` +
              `-# *You are now registered as Away From Keyboard.*\n\n` +
              `> <:members:1528311049726591006> **User:** ${message.author}\n` +
              `> <:website:1528304906400960582> **Scope:** \`${isGlobal ? "Global (All Servers)" : "Server Only"}\`\n` +
              `> <:list:1528313871889334382> **Reason:** \`${reason}\`\n` +
              `> <:clock:1528312173275906088> **Time:** <t:${Math.floor(Date.now() / 1000)}:R>`,
          ),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# *<:astrix:1527205612205903973> Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE. All rights reserved.*`,
          ),
        );

      await i.editReply({
        components: [confirmContainer],
        allowedMentions: { parse: [], repliedUser: false },
      });
      collector.stop("selected");
    });

    collector.on("end", async (collected, reasonCode) => {
      if (reasonCode === "time") {
        try {
          const timeoutContainer =
            new ContainerBuilder().addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `### <:Sleepy:1528993260713017377> AFK Configuration Timed Out\n` +
                  `-# *No option was selected within 30 seconds. Please run the command again.*`,
              ),
            );
          await replyMsg.edit({
            components: [timeoutContainer],
            allowedMentions: { parse: [], repliedUser: false },
          });
        } catch (e) {}
      }
    });
  },
};
