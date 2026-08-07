const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const goodbyeManager = require("../../lib/goodbyeManager");

module.exports = {
  alias: ["goodbyeedit", "leaveedit"],
  category: "Goodbye",
  desc: "Edit goodbye card canvas settings via quick text parameters (template, colors, bg, shape, watermark).",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const sub = args[0]?.toLowerCase();
    const val = args.slice(1).join(" ");
    const config = goodbyeManager.getGuildGoodbye(message.guild.id);
    const channels = config.channels || [];

    const updateAllChannels = (updates) => {
      if (channels.length === 0) {
        goodbyeManager.addGoodbyeChannel(message.guild.id, { channelId: message.channelId, ...updates });
      } else {
        for (const ch of channels) {
          Object.assign(ch, updates);
        }
        goodbyeManager.updateGuildGoodbye(message.guild.id, { channels });
      }
    };

    if (sub === "text" || sub === "textcolor") {
      if (!val) return message.reply("❌ Provide a hex color code! Example: `.goodbyeedit text #ffffff`").catch(() => null);
      const hex = val.startsWith("#") ? val : `#${val}`;
      updateAllChannels({ textColor: hex });
      return message.reply(`✅ Goodbye card text color set to: \`${hex}\``).catch(() => null);
    }

    if (sub === "accent" || sub === "accentcolor") {
      if (!val) return message.reply("❌ Provide a hex color code! Example: `.goodbyeedit accent #e11d48`").catch(() => null);
      const hex = val.startsWith("#") ? val : `#${val}`;
      updateAllChannels({ accentColor: hex });
      return message.reply(`✅ Goodbye card accent color set to: \`${hex}\``).catch(() => null);
    }

    if (sub === "bg" || sub === "background") {
      if (!val) return message.reply("❌ Provide an image URL or `reset`! Example: `.goodbyeedit bg https://example.com/banner.png`").catch(() => null);
      if (val.toLowerCase() === "reset" || val.toLowerCase() === "none") {
        updateAllChannels({ canvasBgUrl: null });
        return message.reply("✅ Goodbye card background image reset to default.").catch(() => null);
      }
      if (!val.startsWith("http://") && !val.startsWith("https://")) {
        return message.reply("❌ Invalid image URL! Must start with http:// or https://").catch(() => null);
      }
      updateAllChannels({ canvasBgUrl: val, canvasEnabled: true });
      return message.reply(`✅ Goodbye card background URL set to: ${val}`).catch(() => null);
    }

    if (sub === "shape" || sub === "frame") {
      const shape = val.toLowerCase();
      const validShapes = ["circle", "square", "hexagon", "rounded"];
      if (!validShapes.includes(shape)) {
        return message.reply(`❌ Invalid shape! Valid choices: \`${validShapes.join("`, `")}\``).catch(() => null);
      }
      updateAllChannels({ avatarShape: shape });
      return message.reply(`✅ Goodbye avatar frame shape set to: \`${shape.toUpperCase()}\``).catch(() => null);
    }

    if (sub === "template" || sub === "theme") {
      const tmpl = val.toLowerCase();
      updateAllChannels({ canvasTemplate: tmpl });
      return message.reply(`✅ Goodbye canvas template theme set to: \`${tmpl}\``).catch(() => null);
    }

    if (sub === "watermark") {
      if (!val || val.toLowerCase() === "reset" || val.toLowerCase() === "none") {
        updateAllChannels({ customWatermark: null });
        return message.reply("✅ Goodbye watermark reset to default server name.").catch(() => null);
      }
      updateAllChannels({ customWatermark: val.toUpperCase() });
      return message.reply(`✅ Goodbye canvas watermark text set to: \`${val.toUpperCase()}\``).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ✏️ Goodbye Card Parameter Editor\n` +
        `-# *Quickly adjust canvas banner visual properties.*\n\n` +
        `> **Subcommands:**\n` +
        `> - \`.goodbyeedit text <#hex>\` — Set text color\n` +
        `> - \`.goodbyeedit accent <#hex>\` — Set accent color\n` +
        `> - \`.goodbyeedit bg <url / reset>\` — Set background image URL\n` +
        `> - \`.goodbyeedit shape <circle|square|hexagon|rounded>\` — Set avatar frame shape\n` +
        `> - \`.goodbyeedit template <name>\` — Set canvas theme template\n` +
        `> - \`.goodbyeedit watermark <text / reset>\` — Set overlay watermark text`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
