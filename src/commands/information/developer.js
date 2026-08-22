const {
  ContainerBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  AttachmentBuilder,
} = require("discord.js");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const path = require("path");
const config = require("../../lib/config.json");

module.exports = {
  alias: ["dev", "developer"],
  category: "Information",
  desc: "View the developer's credentials and server details.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const teamList = config.team || [];
    const fetchedTeam = [];

    for (const memberInfo of teamList) {
      try {
        const user = await client.users.fetch(memberInfo.id, { force: true });
        fetchedTeam.push({
          user,
          role: memberInfo.role,
        });
      } catch (e) {
        console.error(
          `Failed to fetch dev team member with ID ${memberInfo.id}:`,
          e,
        );
      }
    }

    // Fallback to bot application owner if team is empty
    if (fetchedTeam.length === 0) {
      try {
        const application = await client.application.fetch();
        const devUser = application.owner.ownerId
          ? await client.users.fetch(application.owner.ownerId, { force: true })
          : await client.users.fetch(application.owner.id, { force: true });
        fetchedTeam.push({
          user: devUser,
          role: "Owner & Lead Developer",
        });
      } catch (e) {
        return message.reply(
          "Could not retrieve developer information from Discord.",
        );
      }
    }

    // Helper function to draw the card using @napi-rs/canvas
    const generateDevCard = async (dev) => {
      const devUser = dev.user;
      const roleName = dev.role;

      const canvas = createCanvas(900, 350);
      const ctx = canvas.getContext("2d");

      // Load background with fallback options to ensure no baked ghost text shows
      try {
        const bgImage = await loadImage(
          path.join(__dirname, "../../assets/ping_bg.png"),
        );
        ctx.drawImage(bgImage, 0, 0, 900, 350);
      } catch (e) {
        try {
          const bgImage = await loadImage(
            path.join(__dirname, "../../assets/astrix.png"),
          );
          ctx.drawImage(bgImage, 0, 0, 900, 350);
        } catch (err) {
          ctx.fillStyle = "#090a0f";
          ctx.fillRect(0, 0, 900, 350);
        }
      }

      // Draw semi-transparent dark cyberpunk card overlay
      ctx.save();
      ctx.fillStyle = "rgba(10, 11, 16, 0.90)";
      ctx.strokeStyle = "rgba(224, 57, 57, 0.4)";
      ctx.lineWidth = 1.5;

      const cardX = 25;
      const cardY = 25;
      const cardW = 850;
      const cardH = 300;
      const radius = 16;

      ctx.beginPath();
      ctx.moveTo(cardX + radius, cardY);
      ctx.lineTo(cardX + cardW - radius, cardY);
      ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + radius);
      ctx.lineTo(cardX + cardW, cardY + cardH - radius);
      ctx.quadraticCurveTo(
        cardX + cardW,
        cardY + cardH,
        cardX + cardW - radius,
        cardY + cardH,
      );
      ctx.lineTo(cardX + radius, cardY + cardH);
      ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - radius);
      ctx.lineTo(cardX, cardY + radius);
      ctx.quadraticCurveTo(cardX, cardY, cardX + radius, cardY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Subtle grid inside the card
      ctx.strokeStyle = "rgba(255, 255, 255, 0.015)";
      ctx.lineWidth = 1;
      for (let x = cardX; x < cardX + cardW; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, cardY);
        ctx.lineTo(x, cardY + cardH);
        ctx.stroke();
      }
      for (let y = cardY; y < cardY + cardH; y += 25) {
        ctx.beginPath();
        ctx.moveTo(cardX, y);
        ctx.lineTo(cardX + cardW, y);
        ctx.stroke();
      }

      // Neon glowing lines and crosshairs for premium tech HUD look
      ctx.strokeStyle = "rgba(224, 57, 57, 0.15)";
      ctx.beginPath();
      ctx.moveTo(cardX + 20, cardY + cardH / 2);
      ctx.lineTo(cardX + 60, cardY + cardH / 2);
      ctx.moveTo(cardX + cardW - 60, cardY + cardH / 2);
      ctx.lineTo(cardX + cardW - 20, cardY + cardH / 2);
      ctx.stroke();

      // Corner brackets in high contrast red/orange glow
      ctx.strokeStyle = "#ff2e2e";
      ctx.lineWidth = 3.5;
      const len = 15;
      // Top Left
      ctx.beginPath();
      ctx.moveTo(cardX + 10, cardY + 10 + len);
      ctx.lineTo(cardX + 10, cardY + 10);
      ctx.lineTo(cardX + 10 + len, cardY + 10);
      ctx.stroke();
      // Top Right
      ctx.beginPath();
      ctx.moveTo(cardX + cardW - 10 - len, cardY + 10);
      ctx.lineTo(cardX + cardW - 10, cardY + 10);
      ctx.lineTo(cardX + cardW - 10, cardY + 10 + len);
      ctx.stroke();
      // Bottom Left
      ctx.beginPath();
      ctx.moveTo(cardX + 10, cardY + cardH - 10 - len);
      ctx.lineTo(cardX + 10, cardY + cardH - 10);
      ctx.lineTo(cardX + 10 + len, cardY + cardH - 10);
      ctx.stroke();
      // Bottom Right
      ctx.beginPath();
      ctx.moveTo(cardX + cardW - 10 - len, cardY + cardH - 10);
      ctx.lineTo(cardX + cardW - 10, cardY + cardH - 10);
      ctx.lineTo(cardX + cardW - 10, cardY + cardH - 10 - len);
      ctx.stroke();

      // Draw Avatar Section (Left Side)
      const avX = cardX + 115;
      const avY = cardY + cardH / 2;
      const avR = 80;

      // Draw cyber octagon outline for avatar
      ctx.strokeStyle = "rgba(224, 57, 57, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i + Math.PI / 8;
        const x = avX + (avR + 15) * Math.cos(angle);
        const y = avY + (avR + 15) * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      // Outer dashed circle
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.arc(avX, avY, avR + 25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Hexagonal/Octagonal avatar border
      ctx.strokeStyle = "#ff2e2e";
      ctx.shadowColor = "#ff2e2e";
      ctx.shadowBlur = 10;
      ctx.lineWidth = 5;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i + Math.PI / 8;
        const x = avX + avR * Math.cos(angle);
        const y = avY + avR * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Fetch avatar and render inside clip
      let avatarImage;
      try {
        avatarImage = await loadImage(
          devUser.displayAvatarURL({ extension: "png", size: 256 }),
        );
      } catch (e) {
        avatarImage = null;
      }

      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i + Math.PI / 8;
        const x = avX + (avR - 3) * Math.cos(angle);
        const y = avY + (avR - 3) * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.clip();

      if (avatarImage) {
        ctx.drawImage(avatarImage, avX - avR, avY - avR, avR * 2, avR * 2);
      } else {
        ctx.fillStyle = "#161722";
        ctx.fillRect(avX - avR, avY - avR, avR * 2, avR * 2);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 50px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(devUser.username.slice(0, 1).toUpperCase(), avX, avY);
      }
      ctx.restore();

      const contentX = cardX + 240;

      // Setup text alignments
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      // Status tags
      const statusTagX = contentX;
      const statusTagY = cardY + 30;
      ctx.fillStyle = "rgba(46, 204, 113, 0.15)";
      ctx.fillRect(statusTagX, statusTagY, 130, 24);
      ctx.strokeStyle = "#2ecc71";
      ctx.lineWidth = 1;
      ctx.strokeRect(statusTagX, statusTagY, 130, 24);

      ctx.fillStyle = "#2ecc71";
      ctx.font = "bold 11px 'Courier New', monospace";
      ctx.beginPath();
      ctx.arc(statusTagX + 15, statusTagY + 12, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText("STATUS: ACTIVE", statusTagX + 26, statusTagY + 6);

      const clearTagX = statusTagX + 145;
      ctx.fillStyle = "rgba(255, 46, 46, 0.12)";
      ctx.fillRect(clearTagX, statusTagY, 135, 24);
      ctx.strokeStyle = "#ff2e2e";
      ctx.strokeRect(clearTagX, statusTagY, 135, 24);

      ctx.fillStyle = "#ff2e2e";
      ctx.fillText("ACCESS: LEVEL 05", clearTagX + 15, statusTagY + 6);

      // Title Text
      ctx.font = "italic 900 32px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("DEVELOPER", contentX, cardY + 65);

      const devW = ctx.measureText("DEVELOPER ").width;
      ctx.fillStyle = "#ff2e2e";
      ctx.fillText("CREDENTIALS", contentX + devW, cardY + 65);

      // Underline
      ctx.fillStyle = "rgba(255, 46, 46, 0.6)";
      ctx.fillRect(contentX, cardY + 105, 530, 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillRect(contentX, cardY + 109, 530, 1);

      // Details lines drawer helper
      const drawLine = (label, value, yPos) => {
        ctx.fillStyle = "#ff2e2e";
        ctx.fillRect(contentX, yPos + 4, 6, 6);

        ctx.font = "bold 14px 'Courier New', monospace";
        ctx.fillStyle = "#ff2e2e";
        ctx.fillText(label, contentX + 15, yPos);

        const lblW = ctx.measureText(label).width;
        ctx.font = "bold 15px sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(value, contentX + 15 + lblW + 5, yPos);
      };

      const startY = cardY + 125;
      const gap = 32;
      drawLine("NAME       :", devUser.username, startY);
      drawLine("DISCORD ID :", devUser.id, startY + gap);
      drawLine("ROLE       :", roleName, startY + gap * 2);
      drawLine("PROJECT    :", client.user.username, startY + gap * 3);
      drawLine("SUPPORT    :", "discord.gg/FR9pXG2Mwb", startY + gap * 4);

      // Extra footer details
      ctx.font = "bold 8px 'Courier New', monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.fillText(
        "SYS.LOC: //ROOT/DEVS/VINAY",
        cardX + 20,
        cardY + cardH - 22,
      );
      ctx.fillText(
        "SECURE PROTOCOL ACT-980",
        cardX + cardW - 160,
        cardY + cardH - 22,
      );

      // Vertical Watermark
      ctx.save();
      ctx.translate(cardX + cardW - 30, cardY + 80);
      ctx.rotate(Math.PI / 2);
      ctx.font = "bold 9px 'Courier New', monospace";
      ctx.fillStyle = "rgba(255, 46, 46, 0.35)";
      ctx.fillText("© ASTRIXCODE SYSTEM SECURITY", 0, 0);
      ctx.restore();

      return canvas.toBuffer("image/png");
    };

    // Helper function to build a specific page component card
    const buildDevPage = async (pageIndex, disableButtons = false) => {
      const currentDev = fetchedTeam[pageIndex];
      const buffer = await generateDevCard(currentDev);
      const bannerAttachment = new AttachmentBuilder(buffer, {
        name: `developer_${pageIndex}.png`,
      });

      const mediaItem = new MediaGalleryItemBuilder().setURL(
        `attachment://developer_${pageIndex}.png`,
      );
      const mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);

      // Previous button
      const prevBtn = new ButtonBuilder()
        .setCustomId("prev")
        .setLabel("◀")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disableButtons || pageIndex === 0);

      // Current page indicator
      const statusBtn = new ButtonBuilder()
        .setCustomId("status")
        .setLabel(`${pageIndex + 1} of ${fetchedTeam.length}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);

      // Next button
      const nextBtn = new ButtonBuilder()
        .setCustomId("next")
        .setLabel("▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disableButtons || pageIndex === fetchedTeam.length - 1);

      // Support server link
      const supportBtn = new ButtonBuilder()
        .setEmoji("<:discord:1539875375981797596>")
        .setLabel("Support Server")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.gg/FR9pXG2Mwb");

      const row = new ActionRowBuilder().addComponents(
        prevBtn,
        statusBtn,
        nextBtn,
        supportBtn,
      );

      const container = new ContainerBuilder()
        .addMediaGalleryComponents(mediaGallery)
        .addActionRowComponents(row);

      return { container, bannerAttachment };
    };

    let currentPage = 0;
    const { container, bannerAttachment } = await buildDevPage(currentPage);

    const replyMsg = await message.reply({
      components: [container],
      files: [bannerAttachment],
      flags: MessageFlags.IsComponentsV2,
    });

    const filter = (i) => i.user.id === message.author.id;
    const collector = replyMsg.createMessageComponentCollector({
      filter,
      time: 120000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();

      if (i.customId === "prev" && currentPage > 0) {
        currentPage--;
      } else if (
        i.customId === "next" &&
        currentPage < fetchedTeam.length - 1
      ) {
        currentPage++;
      }

      const { container: newContainer, bannerAttachment: newAttachment } =
        await buildDevPage(currentPage);

      await i.editReply({
        components: [newContainer],
        files: [newAttachment],
      });
    });

    collector.on("end", async () => {
      try {
        const { container: finalContainer, bannerAttachment: finalAttachment } =
          await buildDevPage(currentPage, true);
        await replyMsg.edit({
          components: [finalContainer],
          files: [finalAttachment],
        });
      } catch (e) {}
    });
  },
};
