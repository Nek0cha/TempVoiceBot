const { db } = require('../database');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);

    // Recovery: remove stale temp channel records for channels deleted while offline
    const tempChannels = db.prepare('SELECT * FROM temp_channels').all();
    let cleaned = 0;

    for (const record of tempChannels) {
      const guild = client.guilds.cache.get(record.guild_id);
      if (!guild) continue;

      const voiceChannel = guild.channels.cache.get(record.channel_id);
      if (!voiceChannel) {
        db.prepare('DELETE FROM temp_channels WHERE channel_id = ?').run(record.channel_id);
        cleaned++;
        const textChannel = guild.channels.cache.get(record.text_channel_id);
        try { if (textChannel) await textChannel.delete(); } catch {}
      }
    }

    const active = db.prepare('SELECT COUNT(*) as cnt FROM temp_channels').get().cnt;
    console.log(`🔍 Recovery complete. Cleaned: ${cleaned}, Active: ${active}`);
  },
};
