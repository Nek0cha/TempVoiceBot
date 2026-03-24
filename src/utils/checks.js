'use strict';
const { db } = require('../database');

function getOwnedTempChannel(guildId, userId) {
  return db.prepare(
    'SELECT * FROM temp_channels WHERE guild_id = ? AND owner_id = ?'
  ).get(guildId, userId);
}

function getTempChannel(channelId) {
  return db.prepare('SELECT * FROM temp_channels WHERE channel_id = ?').get(channelId);
}

function getTempChannelByText(textChannelId) {
  return db.prepare('SELECT * FROM temp_channels WHERE text_channel_id = ?').get(textChannelId);
}

module.exports = { getOwnedTempChannel, getTempChannel, getTempChannelByText };
