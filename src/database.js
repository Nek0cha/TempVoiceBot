'use strict';
/**
 * Structured database helpers built on top of src/database/db.js.
 * All other modules should import from here, not from database/db directly.
 */
const db = require('./database/db');

// ---- master_channels ----
const masterChannels = {
  upsert: db.prepare(
    'INSERT OR REPLACE INTO master_channels (guild_id, channel_id, category_id, template) VALUES (@guildId, @channelId, @categoryId, @template)'
  ),
  remove:         db.prepare('DELETE FROM master_channels WHERE channel_id = ?'),
  getByChannel:   db.prepare('SELECT * FROM master_channels WHERE channel_id = ?'),
  getByGuild:     db.prepare('SELECT * FROM master_channels WHERE guild_id = ?'),
  updateTemplate: db.prepare('UPDATE master_channels SET template = ? WHERE channel_id = ?'),
  updateCategory: db.prepare('UPDATE master_channels SET category_id = ? WHERE channel_id = ?'),
};

// ---- temp_channels ----
const tempChannels = {
  add: db.prepare(
    'INSERT INTO temp_channels (channel_id, text_channel_id, owner_id, guild_id, panel_message_id, master_channel_id) VALUES (@channelId, @textChannelId, @ownerId, @guildId, @panelMessageId, @masterChannelId)'
  ),
  remove:             db.prepare('DELETE FROM temp_channels WHERE channel_id = ?'),
  getByChannel:       db.prepare('SELECT * FROM temp_channels WHERE channel_id = ?'),
  getByTextChannel:   db.prepare('SELECT * FROM temp_channels WHERE text_channel_id = ?'),
  getByOwner:         db.prepare('SELECT * FROM temp_channels WHERE owner_id = ? AND guild_id = ?'),
  getByGuild:         db.prepare('SELECT * FROM temp_channels WHERE guild_id = ?'),
  updateOwner:        db.prepare('UPDATE temp_channels SET owner_id = ?         WHERE channel_id = ?'),
  updatePanelMessage: db.prepare('UPDATE temp_channels SET panel_message_id = ? WHERE channel_id = ?'),
  updateLocked:       db.prepare('UPDATE temp_channels SET is_locked = ?        WHERE channel_id = ?'),
  updatePrivate:      db.prepare('UPDATE temp_channels SET is_private = ?       WHERE channel_id = ?'),
  updateHidden:       db.prepare('UPDATE temp_channels SET is_hidden = ?        WHERE channel_id = ?'),

  addBan(channelId, userId) {
    const record = this.getByChannel.get(channelId);
    if (!record) return;
    const banned = JSON.parse(record.banned_users);
    if (!banned.includes(userId)) {
      banned.push(userId);
      db.prepare('UPDATE temp_channels SET banned_users = ? WHERE channel_id = ?')
        .run(JSON.stringify(banned), channelId);
    }
  },
  removeBan(channelId, userId) {
    const record = this.getByChannel.get(channelId);
    if (!record) return;
    const filtered = JSON.parse(record.banned_users).filter(id => id !== userId);
    db.prepare('UPDATE temp_channels SET banned_users = ? WHERE channel_id = ?')
      .run(JSON.stringify(filtered), channelId);
  },
  isBanned(channelId, userId) {
    const record = this.getByChannel.get(channelId);
    if (!record) return false;
    return JSON.parse(record.banned_users).includes(userId);
  },
};

module.exports = { db, masterChannels, tempChannels };
