'use strict';
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { config } = require('../config');

/**
 * ボタンパネルを 2 行 × 5 ボタンで構築して返す。
 * @returns {ActionRowBuilder[]}
 */
function buildPanel() {
  const { buttons } = config;

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('vc_lock')
      .setLabel(buttons.lock.label)
      .setEmoji(buttons.lock.emoji)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('vc_private')
      .setLabel(buttons.private.label)
      .setEmoji(buttons.private.emoji)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('vc_rename')
      .setLabel(buttons.rename.label)
      .setEmoji(buttons.rename.emoji)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('vc_limit')
      .setLabel(buttons.limit.label)
      .setEmoji(buttons.limit.emoji)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('vc_bitrate')
      .setLabel(buttons.bitrate.label)
      .setEmoji(buttons.bitrate.emoji)
      .setStyle(ButtonStyle.Secondary),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('vc_kick')
      .setLabel(buttons.kick.label)
      .setEmoji(buttons.kick.emoji)
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('vc_ban')
      .setLabel(buttons.ban.label)
      .setEmoji(buttons.ban.emoji)
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('vc_invite')
      .setLabel(buttons.invite.label)
      .setEmoji(buttons.invite.emoji)
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('vc_claim')
      .setLabel(buttons.claim.label)
      .setEmoji(buttons.claim.emoji)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('vc_transfer')
      .setLabel(buttons.transfer.label)
      .setEmoji(buttons.transfer.emoji)
      .setStyle(ButtonStyle.Secondary),
  );

  return [row1, row2];
}

module.exports = { buildPanel };
