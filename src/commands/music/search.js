const {
  ContainerBuilder,
  TextDisplayBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
  ComponentType,
} = require("discord.js");
const { getSearchEngine } = require("../../lib/musicManager.js");

function formatDuration(ms) {
  if (!ms || isNaN(ms) || ms === 0) return "Live Stream";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    : `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["search", "find", "searchtrack"],
  category: "Music",
  desc: "Search for tracks and select which one to play.",

  botPermissions: ["SendMessages", "Connect", "Speak"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    try {
      const voiceChannel =
        message.member?.voice?.channel ||
        (message.member?.voice?.channelId
          ? message.guild?.channels?.cache?.get(message.member.voice.channelId)
          : null);

      if (!voiceChannel) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Voice Channel Required\n` +
              `-# *You must be connected to a voice channel to use search.*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      const query = args.join(" ");
      if (!query) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Missing Search Query\n` +
              `-# *Please specify a keyword or song title to search.*\n\n` +
              `> - **Usage:** \`${client.prefix || "."}search <title | artist>\``,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      let existingPlayer = client.manager.players.get(message.guild.id);
      if (existingPlayer && existingPlayer.voiceId !== voiceChannel.id) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Channel Mismatch\n` +
              `-# *You must be in the same voice channel as the bot (<#${existingPlayer.voiceId}>).*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      const engine = getSearchEngine(query);
      let res;
      try {
        res = await client.manager.search(query, {
          requester: message.author,
          engine: engine,
        });
      } catch (_) {
        res = await client.manager.search(query, {
          requester: message.author,
          engine: "youtube",
        }).catch(() => null);
      }

      if (!res || !res.tracks || !res.tracks.length || res.type === "EMPTY") {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> No Results Found\n` +
              `-# *Could not find any tracks matching "${query}".*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      const topTracks = res.tracks.slice(0, 5);

      const options = topTracks.map((t, index) => {
        const label = `${index + 1}. ${(t.title || "Unknown").substring(0, 80)}`;
        const description = `${(t.author || "Artist").substring(0, 40)} • ${formatDuration(t.length)}`;
        return {
          label: label,
          description: description,
          value: `search_result_${index}`,
        };
      });

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("search_select_menu")
        .setPlaceholder("Select a track to play...")
        .addOptions(options);

      const selectRow = new ActionRowBuilder().addComponents(selectMenu);

      const tracksListStr = topTracks
        .map(
          (t, i) =>
            `> **${i + 1}.** [${t.title}](${t.uri}) — \`${formatDuration(t.length)}\``,
        )
        .join("\n");

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔍 Search Results for: \`${query}\`\n\n` +
            `${tracksListStr}\n\n` +
            `-# *Select an option from the menu below within 30 seconds to play.*`,
        ),
      );

      const replyMsg = await message.reply({
        components: [container, selectRow],
        flags: MessageFlags.IsComponentsV2,
      });

      const collector = replyMsg.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 30000,
      });

      collector.on("collect", async (interaction) => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({
            content: "⚠️ Only the user who ran the command can select a track.",
            flags: MessageFlags.Ephemeral,
          });
        }

        const selectedIndex = parseInt(
          interaction.values[0].replace("search_result_", ""),
          10,
        );
        const selectedTrack = topTracks[selectedIndex];

        let player = client.manager.players.get(message.guild.id);
        if (!player) {
          player = await client.manager.createPlayer({
            guildId: message.guild.id,
            voiceId: voiceChannel.id,
            textId: message.channel.id,
            deaf: true,
          });
        }

        player.queue.add(selectedTrack);
        if (!player.playing && !player.paused) {
          await player.play();
        }

        const resultContainer = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `🎶 **Queued Track #${selectedIndex + 1}:** [${selectedTrack.title}](${selectedTrack.uri}) (\`${formatDuration(selectedTrack.length)}\`)`,
          ),
        );

        await interaction.update({
          components: [resultContainer],
          flags: MessageFlags.IsComponentsV2,
        });

        collector.stop("selected");
      });

      collector.on("end", (_, reason) => {
        if (reason !== "selected") {
          replyMsg.edit({ components: [] }).catch(() => null);
        }
      });
    } catch (err) {
      console.error("[SearchCommand] Error:", err);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "❌ **An error occurred while performing search.**",
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }
  },
};
