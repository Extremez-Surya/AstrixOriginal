const {
  ContainerBuilder,
  TextDisplayBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
  ApplicationCommandOptionType,
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

module.exports = {
  name: "search",
  description: "Search for tracks and select which one to play.",
  options: [
    {
      name: "query",
      description: "Keyword or song title to search",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  async execute(client, interaction) {
    try {
      const voiceChannel =
        interaction.member?.voice?.channel ||
        (interaction.member?.voice?.channelId
          ? interaction.guild?.channels?.cache?.get(interaction.member.voice.channelId)
          : null);

      if (!voiceChannel) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Voice Channel Required\n` +
              `-# *You must be connected to a voice channel to use search.*`
          )
        );
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      const query = interaction.options.getString("query");

      let existingPlayer = client.manager.players.get(interaction.guild.id);
      if (existingPlayer && existingPlayer.voiceId !== voiceChannel.id) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Channel Mismatch\n` +
              `-# *You must be in the same voice channel as the bot (<#${existingPlayer.voiceId}>).*`
          )
        );
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      await interaction.deferReply().catch(() => null);

      const engine = getSearchEngine(query);
      let res;
      try {
        res = await client.manager.search(query, {
          requester: interaction.user,
          engine: engine,
        });
      } catch (_) {
        res = await client.manager.search(query, {
          requester: interaction.user,
          engine: "youtube",
        }).catch(() => null);
      }

      if (!res || !res.tracks || !res.tracks.length || res.type === "EMPTY") {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> No Results Found\n` +
              `-# *Could not find any tracks matching "${query}".*`
          )
        );
        return interaction.editReply({
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
          value: `search_slash_${index}`,
        };
      });

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("search_slash_select_menu")
        .setPlaceholder("Select a track to play...")
        .addOptions(options);

      const selectRow = new ActionRowBuilder().addComponents(selectMenu);

      const tracksListStr = topTracks
        .map(
          (t, i) =>
            `> **${i + 1}.** [${t.title}](${t.uri}) — \`${formatDuration(t.length)}\``
        )
        .join("\n");

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔍 Search Results for: \`${query}\`\n\n` +
            `${tracksListStr}\n\n` +
            `-# *Select an option from the menu below within 30 seconds to play.*`
        )
      );

      const replyMsg = await interaction.editReply({
        components: [container, selectRow],
        flags: MessageFlags.IsComponentsV2,
      });

      const collector = replyMsg.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 30000,
      });

      collector.on("collect", async (menuInteraction) => {
        if (menuInteraction.user.id !== interaction.user.id) {
          return menuInteraction.reply({
            content: "⚠️ Only the user who ran the command can select a track.",
            flags: MessageFlags.Ephemeral,
          });
        }

        const selectedIndex = parseInt(
          menuInteraction.values[0].replace("search_slash_", ""),
          10
        );
        const selectedTrack = topTracks[selectedIndex];

        let player = client.manager.players.get(interaction.guild.id);
        if (!player) {
          player = await client.manager.createPlayer({
            guildId: interaction.guild.id,
            voiceId: voiceChannel.id,
            textId: interaction.channel.id,
            deaf: true,
          });
        }

        player.queue.add(selectedTrack);
        if (!player.playing && !player.paused) {
          await player.play();
        }

        const resultContainer = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `🎶 **Queued Track #${selectedIndex + 1}:** [${selectedTrack.title}](${selectedTrack.uri}) (\`${formatDuration(selectedTrack.length)}\`)`
          )
        );

        await menuInteraction.update({
          components: [resultContainer],
          flags: MessageFlags.IsComponentsV2,
        });

        collector.stop("selected");
      });

      collector.on("end", (_, reason) => {
        if (reason !== "selected") {
          interaction.editReply({ components: [] }).catch(() => null);
        }
      });
    } catch (err) {
      console.error("[SearchSlash] Error:", err);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent("❌ **An error occurred while performing search.**")
      );
      return interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }
  },
};
