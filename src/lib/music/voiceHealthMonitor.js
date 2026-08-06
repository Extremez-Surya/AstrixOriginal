/**
 * Voice Channel Health & Inactivity Monitor for Astrix
 */

class VoiceHealthMonitor {
  constructor(client) {
    this.client = client;
    this.checkInterval = 30000; // Check every 30s
    this.idleTimeouts = new Map(); // guildId -> timestamp of idle start
    this.maxIdleDuration = 180000; // 3 minutes idle auto-disconnect
    this.timer = null;
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.runCheck(), this.checkInterval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  updateActivity(guildId) {
    this.idleTimeouts.delete(guildId);
  }

  async runCheck() {
    if (!this.client?.manager?.players) return;

    for (const [guildId, player] of this.client.manager.players.entries()) {
      try {
        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) {
          player.destroy().catch(() => null);
          this.idleTimeouts.delete(guildId);
          continue;
        }

        const voiceChannel = guild.channels.cache.get(player.voiceId);
        if (!voiceChannel) {
          player.destroy().catch(() => null);
          this.idleTimeouts.delete(guildId);
          continue;
        }

        // Check human members in voice channel
        const humanMembers = voiceChannel.members.filter((m) => !m.user.bot);
        const isAlone = humanMembers.size === 0;
        const isQueueEmpty = !player.playing && (!player.queue || player.queue.size === 0);

        if (isAlone || isQueueEmpty) {
          if (!this.idleTimeouts.has(guildId)) {
            this.idleTimeouts.set(guildId, Date.now());
          } else {
            const startTime = this.idleTimeouts.get(guildId);
            if (Date.now() - startTime >= this.maxIdleDuration) {
              console.log(`[VoiceHealthMonitor] Auto-disconnecting idle player in guild ${guildId}`);
              this.idleTimeouts.delete(guildId);
              await player.destroy().catch(() => null);
            }
          }
        } else {
          this.idleTimeouts.delete(guildId);
        }
      } catch (err) {
        console.error(`[VoiceHealthMonitor] Check error for guild ${guildId}:`, err);
      }
    }
  }
}

module.exports = VoiceHealthMonitor;
