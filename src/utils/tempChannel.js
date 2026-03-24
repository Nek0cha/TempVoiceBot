const { PermissionFlagsBits, ChannelType } = require('discord.js');
const { db } = require('../database');
const { buildPanel } = require('./panel');
const { config, format } = require('../config');

// Per-user creation lock to prevent race conditions
const creationLocks = new Set();

async function createTempChannel(guild, member, masterConfig) {
  const lockKey = `${guild.id}:${member.id}`;
  if (creationLocks.has(lockKey)) return;
  creationLocks.add(lockKey);

  try {
    const count =
      (db.prepare('SELECT COUNT(*) as cnt FROM temp_channels WHERE guild_id = ?').get(guild.id)?.cnt ?? 0) + 1;
    const channelName = (masterConfig.template || '%owner%のチャンネル')
      .replace(/%owner%/g, member.displayName)
      .replace(/%counter%/g, count);

    const category = masterConfig.category_id
      ? guild.channels.cache.get(masterConfig.category_id) ?? null
      : null;

    const voiceChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildVoice,
      parent: category,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel],
        },
        {
          id: member.id,
          allow: [
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.MoveMembers,
          ],
        },
      ],
    });

    const textChannelName = format(
      config.panel.textChannelTemplate || 'vc-{vcname}',
      { vcname: channelName, owner: member.displayName, counter: count },
    ).slice(0, 100);

    const textChannel = await guild.channels.create({
      name: textChannelName,
      type: ChannelType.GuildText,
      parent: category,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: member.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ],
    });

    await member.voice.setChannel(voiceChannel);

    const panelMessage = await textChannel.send({
      content: format(config.panel.welcomeMessage, { owner: member.id }),
      components: buildPanel(),
    });

    db.prepare(`
      INSERT INTO temp_channels (channel_id, text_channel_id, owner_id, guild_id, panel_message_id, master_channel_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      voiceChannel.id,
      textChannel.id,
      member.id,
      guild.id,
      panelMessage.id,
      masterConfig.channel_id,
    );
  } finally {
    setTimeout(() => creationLocks.delete(lockKey), 3000);
  }
}

async function deleteTempChannel(guild, tempRecord) {
  db.prepare('DELETE FROM temp_channels WHERE channel_id = ?').run(tempRecord.channel_id);

  const voiceChannel = guild.channels.cache.get(tempRecord.channel_id);
  const textChannel  = guild.channels.cache.get(tempRecord.text_channel_id);

  try { if (voiceChannel) await voiceChannel.delete(); } catch {}
  try { if (textChannel)  await textChannel.delete();  } catch {}
}

module.exports = { createTempChannel, deleteTempChannel };
