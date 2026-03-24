const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function buildPanel() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('vc_lock')
      .setLabel('Lock')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('vc_privacy')
      .setLabel('Public/Private')
      .setEmoji('🌐')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('vc_hide')
      .setLabel('Hide')
      .setEmoji('👁️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('vc_kick')
      .setLabel('Kick')
      .setEmoji('👢')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('vc_invite')
      .setLabel('Invite')
      .setEmoji('➕')
      .setStyle(ButtonStyle.Success),
  );
}

module.exports = { buildPanel };
