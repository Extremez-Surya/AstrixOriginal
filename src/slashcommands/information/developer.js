const {
  ApplicationCommandType,
  ContainerBuilder,
  TextDisplayBuilder,
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
const {
  generateDeveloperBoard,
  generateDeveloperDetailsBoard,
  getBestDisplayName,
} = require("../../lib/developerCanvas");

module.exports = {
  name: "developer",
  category: "Information",
  description: "View the official Astrix developer team directory and credentials.",
  type: ApplicationCommandType.ChatInput,

  botPermissions: ["SendMessages", "AttachFiles"],
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
          bio:
            memberInfo.bio ||
            (memberInfo.role.toLowerCase().includes("owner")
              ? "Lead architect & security engineer of Astrix."
              : memberInfo.role.toLowerCase().includes("lead")
              ? "Core developer & systems architect of Astrix."
              : memberInfo.role.toLowerCase().includes("og")
              ? "Original foundational developer & core contributor."
              : memberInfo.role.toLowerCase().includes("designer")
              ? "UI/UX & brand visual aesthetic architect."
              : "Astrix core development team member."),
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
    let currentView = "overview"; // "overview" | "details"

    const buildBoardPayload = async (view, pageIdx, disableControls = false) => {
      let buffer;
      let fileName;

      if (view === "overview") {
        buffer = await generateDeveloperBoard(fetchedTeam, { page: pageIdx });
        fileName = `astrix_team_overview_p${pageIdx}.png`;
      } else {
        buffer = await generateDeveloperDetailsBoard(fetchedTeam, { page: pageIdx });
        fileName = `astrix_team_details_p${pageIdx}.png`;
      }

      const attachment = new AttachmentBuilder(buffer, { name: fileName });
      const mediaItem = new MediaGalleryItemBuilder().setURL(`attachment://${fileName}`);
      const mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);

      const container = new ContainerBuilder();

      // Panoramic Board Canvas
      container.addMediaGalleryComponents(mediaGallery);

      // Main Navigation Row
      const toggleBtn =
        view === "overview"
          ? new ButtonBuilder()
              .setCustomId("dev_slash_view_details")
              .setLabel("More Info")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(disableControls)
          : new ButtonBuilder()
              .setCustomId("dev_slash_view_overview")
              .setLabel("Team Overview")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(disableControls);

      const prevBtn = new ButtonBuilder()
        .setCustomId("dev_slash_prev")
        .setLabel("Previous")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disableControls || pageIdx === 0);

      const nextBtn = new ButtonBuilder()
        .setCustomId("dev_slash_next")
        .setLabel("Next")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disableControls || pageIdx >= totalPages - 1);

      const mainRow = new ActionRowBuilder().addComponents(toggleBtn, prevBtn, nextBtn);

      container.addActionRowComponents(mainRow);

      return { container, attachment };
    };

    const { container, attachment } = await buildBoardPayload(currentView, currentPage);

    const replyMsg = await interaction.editReply({
      components: [container],
      files: [attachment],
      flags: MessageFlags.IsComponentsV2,
    });

    const filter = (i) => i.user.id === interaction.user.id;
    const collector = replyMsg.createMessageComponentCollector({
      filter,
      time: 180000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();

      if (i.customId === "dev_slash_view_details") {
        currentView = "details";
      } else if (i.customId === "dev_slash_view_overview") {
        currentView = "overview";
      } else if (i.customId === "dev_slash_prev" && currentPage > 0) {
        currentPage--;
      } else if (i.customId === "dev_slash_next" && currentPage < totalPages - 1) {
        currentPage++;
      }

      const { container: newContainer, attachment: newAttachment } =
        await buildBoardPayload(currentView, currentPage);

      await i.editReply({
        components: [newContainer],
        files: [newAttachment],
      });
    });

    collector.on("end", async () => {
      try {
        const { container: finalContainer, attachment: finalAttachment } =
          await buildBoardPayload(currentView, currentPage, true);
        await interaction.editReply({
          components: [finalContainer],
          files: [finalAttachment],
        });
      } catch (_) {}
    });
  },
};
