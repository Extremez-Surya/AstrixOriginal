const {
  ApplicationCommandType,
  ContainerBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  AttachmentBuilder,
} = require("discord.js");
const { loadImage } = require("@napi-rs/canvas");
const config = require("../../lib/config.json");
const { generateDeveloperBoard, getBestDisplayName } = require("../../lib/developerCanvas");

module.exports = {
  name: "developer",
  category: "Information",
  description: "View the official developer team directory and credentials.",
  type: ApplicationCommandType.ChatInput,

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const teamList = config.team || [];
    const fetchedTeam = [];

    for (const memberInfo of teamList) {
      try {
        const user = await client.users.fetch(memberInfo.id, { force: true });
        let avatarImg = null;
        if (user.avatar) {
          const avatarUrl = user.displayAvatarURL({ extension: "png", size: 256, forceStatic: true });
          try {
            avatarImg = await loadImage(avatarUrl);
          } catch (_) {}
        }

        // Check live presence in the current guild
        let status = "offline";
        if (interaction.guild) {
          const gm = interaction.guild.members.cache.get(memberInfo.id);
          if (gm?.presence?.status) {
            status = gm.presence.status;
          }
        }

        fetchedTeam.push({
          id: user.id,
          username: user.username,
          globalName: user.globalName,
          displayName: getBestDisplayName(user),
          role: memberInfo.role,
          status,
          avatarImg,
          bio: memberInfo.bio || (memberInfo.role.includes("Owner") ? "Lead architect & security engineer of Astrix." : "No bio set."),
        });
      } catch (e) {
        console.error(`Failed to fetch dev team member with ID ${memberInfo.id}:`, e);
      }
    }

    // Fallback to bot application owner if team is empty
    if (fetchedTeam.length === 0) {
      try {
        const application = await client.application.fetch();
        const devUser = application.owner.ownerId
          ? await client.users.fetch(application.owner.ownerId, { force: true })
          : await client.users.fetch(application.owner.id, { force: true });

        let avatarImg = null;
        if (devUser.avatar) {
          const avatarUrl = devUser.displayAvatarURL({ extension: "png", size: 256, forceStatic: true });
          try {
            avatarImg = await loadImage(avatarUrl);
          } catch (_) {}
        }

        fetchedTeam.push({
          id: devUser.id,
          username: devUser.username,
          displayName: getBestDisplayName(devUser),
          role: "Owner & Lead Developer",
          status: "online",
          avatarImg,
          bio: "Lead architect & security engineer of Astrix.",
        });
      } catch (e) {
        return interaction.editReply("Could not retrieve developer information from Discord.");
      }
    }

    const pageSize = 5;
    const totalPages = Math.max(1, Math.ceil(fetchedTeam.length / pageSize));
    let currentPage = 0;

    const buildBoardPayload = async (pageIdx, disableControls = false) => {
      const buffer = await generateDeveloperBoard(fetchedTeam, { page: pageIdx });
      const attachment = new AttachmentBuilder(buffer, {
        name: `astrix_team_p${pageIdx}.png`,
      });

      const mediaItem = new MediaGalleryItemBuilder().setURL(
        `attachment://astrix_team_p${pageIdx}.png`
      );
      const mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);

      const actionRows = [];

      // Pagination controls if more than 5 members
      if (totalPages > 1) {
        const prevBtn = new ButtonBuilder()
          .setCustomId("dev_prev")
          .setLabel("◀")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disableControls || pageIdx === 0);

        const pageIndicator = new ButtonBuilder()
          .setCustomId("dev_page")
          .setLabel(`Page ${pageIdx + 1} / ${totalPages}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true);

        const nextBtn = new ButtonBuilder()
          .setCustomId("dev_next")
          .setLabel("▶")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disableControls || pageIdx >= totalPages - 1);

        actionRows.push(new ActionRowBuilder().addComponents(prevBtn, pageIndicator, nextBtn));
      }

      // External resource buttons
      const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;
      const inviteBtn = new ButtonBuilder()
        .setEmoji("🔗")
        .setLabel("Invite")
        .setStyle(ButtonStyle.Link)
        .setURL(inviteUrl);

      const supportBtn = new ButtonBuilder()
        .setEmoji("💬")
        .setLabel("Support Server")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.gg/FR9pXG2Mwb");

      const websiteBtn = new ButtonBuilder()
        .setEmoji("🌐")
        .setLabel("Website")
        .setStyle(ButtonStyle.Link)
        .setURL("https://extremez.vercel.app/");

      actionRows.push(new ActionRowBuilder().addComponents(inviteBtn, supportBtn, websiteBtn));

      const container = new ContainerBuilder()
        .addMediaGalleryComponents(mediaGallery)
        .addActionRowComponents(...actionRows);

      return { container, attachment };
    };

    const { container, attachment } = await buildBoardPayload(currentPage);

    const replyMsg = await interaction.editReply({
      components: [container],
      files: [attachment],
      flags: MessageFlags.IsComponentsV2,
    });

    if (totalPages <= 1) return;

    const filter = (i) => i.user.id === interaction.user.id;
    const collector = replyMsg.createMessageComponentCollector({
      filter,
      time: 120000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();

      if (i.customId === "dev_prev" && currentPage > 0) {
        currentPage--;
      } else if (i.customId === "dev_next" && currentPage < totalPages - 1) {
        currentPage++;
      }

      const { container: newContainer, attachment: newAttachment } =
        await buildBoardPayload(currentPage);

      await i.editReply({
        components: [newContainer],
        files: [newAttachment],
      });
    });

    collector.on("end", async () => {
      try {
        const { container: finalContainer, attachment: finalAttachment } =
          await buildBoardPayload(currentPage, true);
        await replyMsg.edit({
          components: [finalContainer],
          files: [finalAttachment],
        });
      } catch (_) {}
    });
  },
};
