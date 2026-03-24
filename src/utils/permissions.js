'use strict';
/**
 * Recalculate and apply voice-channel permission overwrites based on the
 * current state stored in the temp_channels DB record.
 *
 * State flags: is_locked, is_private, is_hidden, banned_users (JSON array)
 *
 * Effective behaviour:
 *  - is_private : @everyone ViewChannel=deny, Connect=deny
 *  - is_locked  : @everyone Connect=deny  (View unaffected unless also private)
 *  - is_hidden  : @everyone ViewChannel=deny (Connect unaffected unless also locked/private)
 *  - owner      : always ViewChannel=allow, Connect=allow, MoveMembers=allow
 *  - banned user: ViewChannel=deny, Connect=deny
 */
const { PermissionFlagsBits } = require('discord.js');

async function applyVCPermissions(voiceChannel, guild, record) {
  const everyone = guild.roles.everyone;
  const banned   = JSON.parse(record.banned_users || '[]');

  // @everyone overwrite
  const everyoneView    = !record.is_hidden  && !record.is_private;
  const everyoneConnect = !record.is_locked  && !record.is_private;

  const overwrites = [
    {
      id:    everyone.id,
      allow: [
        ...(everyoneView    ? [PermissionFlagsBits.ViewChannel] : []),
        ...(everyoneConnect ? [PermissionFlagsBits.Connect]     : []),
      ],
      deny: [
        ...(everyoneView    ? [] : [PermissionFlagsBits.ViewChannel]),
        ...(everyoneConnect ? [] : [PermissionFlagsBits.Connect]),
      ],
    },
    // Owner always has full control
    {
      id:    record.owner_id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.MoveMembers,
      ],
    },
    // Banned users cannot view or connect
    ...banned.map(uid => ({
      id:   uid,
      deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
    })),
  ];

  await voiceChannel.permissionOverwrites.set(overwrites);
}

/**
 * Sync text-channel visibility so only current VC members can see it.
 * The owner always keeps access regardless of whether they are in the VC.
 */
async function syncTextChannel(voiceChannel, textChannel, ownerId) {
  if (!textChannel) return;

  const memberIds = [...voiceChannel.members.keys()];
  const allowed   = new Set([ownerId, ...memberIds]);

  const overwrites = [
    {
      id:   textChannel.guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    ...[...allowed].map(uid => ({
      id:    uid,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    })),
  ];

  await textChannel.permissionOverwrites.set(overwrites).catch(() => {});
}

module.exports = { applyVCPermissions, syncTextChannel };
