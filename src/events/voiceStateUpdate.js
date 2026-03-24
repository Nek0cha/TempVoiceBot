const { db } = require('../database');
const { createTempChannel, deleteTempChannel } = require('../utils/tempChannel');
const { syncTextChannel } = require('../utils/permissions');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const guild  = newState.guild  ?? oldState.guild;
    const member = newState.member ?? oldState.member;

    // ── Joined a channel ───────────────────────────────────────────────────
    if (newState.channelId && newState.channelId !== oldState.channelId) {
      const masterConfig = db.prepare(
        'SELECT * FROM master_channels WHERE guild_id = ? AND channel_id = ?'
      ).get(guild.id, newState.channelId);

      if (masterConfig) {
        await createTempChannel(guild, member, masterConfig).catch(console.error);
        return; // member will fire another voiceStateUpdate after being moved
      }

      // Grant text channel access to a member joining an existing temp channel
      const tempRecord = db
        .prepare('SELECT * FROM temp_channels WHERE channel_id = ?')
        .get(newState.channelId);

      if (tempRecord?.text_channel_id) {
        const textCh = guild.channels.cache.get(tempRecord.text_channel_id);
        if (textCh && newState.channel) {
          await syncTextChannel(newState.channel, textCh, tempRecord.owner_id).catch(console.error);
        }
      }
    }

    // ── Left a channel ─────────────────────────────────────────────────────
    if (oldState.channelId && oldState.channelId !== newState.channelId) {
      const tempRecord = db
        .prepare('SELECT * FROM temp_channels WHERE channel_id = ?')
        .get(oldState.channelId);

      if (!tempRecord) return;

      const voiceChannel = guild.channels.cache.get(tempRecord.channel_id);

      // Delete temp channel when empty
      if (!voiceChannel || voiceChannel.members.size === 0) {
        await deleteTempChannel(guild, tempRecord).catch(console.error);
        return;
      }

      // Still occupied → sync text-channel permissions
      const textCh = guild.channels.cache.get(tempRecord.text_channel_id);
      if (textCh) {
        await syncTextChannel(voiceChannel, textCh, tempRecord.owner_id).catch(console.error);
      }
    }
  },
};
