'use strict';
const { UserSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const { db, tempChannels } = require('../database');
const { applyVCPermissions } = require('../utils/permissions');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {

    // Slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(`Command error [${interaction.commandName}]:`, err);
        const msg = { content: 'コマンドの実行中にエラーが発生しました。', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg);
        } else {
          await interaction.reply(msg);
        }
      }
      return;
    }

    // Button interactions
    if (interaction.isButton()) {
      const tempRecord = db
        .prepare('SELECT * FROM temp_channels WHERE text_channel_id = ?')
        .get(interaction.channelId);
      if (!tempRecord) return;

      if (tempRecord.owner_id !== interaction.user.id) {
        return interaction.reply({ content: 'チャンネルのオーナーのみ操作できます。', ephemeral: true });
      }

      const voiceChannel = interaction.guild.channels.cache.get(tempRecord.channel_id);
      if (!voiceChannel) return interaction.reply({ content: 'ボイスチャンネルが見つかりません。', ephemeral: true });

      switch (interaction.customId) {
        case 'vc_lock': {
          const newVal = tempRecord.is_locked ? 0 : 1;
          tempChannels.updateLocked.run(newVal, tempRecord.channel_id);
          const updated = tempChannels.getByChannel.get(tempRecord.channel_id);
          await applyVCPermissions(voiceChannel, interaction.guild, updated);
          await interaction.reply({ content: newVal ? 'チャンネルをロックしました。' : 'ロックを解除しました。', ephemeral: true });
          break;
        }
        case 'vc_privacy': {
          const newVal = tempRecord.is_private ? 0 : 1;
          tempChannels.updatePrivate.run(newVal, tempRecord.channel_id);
          const updated = tempChannels.getByChannel.get(tempRecord.channel_id);
          await applyVCPermissions(voiceChannel, interaction.guild, updated);
          await interaction.reply({ content: newVal ? 'チャンネルを招待制にしました。' : 'チャンネルを公開しました。', ephemeral: true });
          break;
        }
        case 'vc_hide': {
          const newVal = tempRecord.is_hidden ? 0 : 1;
          tempChannels.updateHidden.run(newVal, tempRecord.channel_id);
          const updated = tempChannels.getByChannel.get(tempRecord.channel_id);
          await applyVCPermissions(voiceChannel, interaction.guild, updated);
          await interaction.reply({ content: newVal ? 'チャンネルを非表示にしました。' : 'チャンネルを表示しました。', ephemeral: true });
          break;
        }
        case 'vc_kick': {
          const row = new ActionRowBuilder().addComponents(
            new UserSelectMenuBuilder()
              .setCustomId('vc_kick_select')
              .setPlaceholder('キックするユーザーを選択')
              .setMinValues(1).setMaxValues(1),
          );
          await interaction.reply({ content: 'キックするユーザーを選択してください:', components: [row], ephemeral: true });
          break;
        }
        case 'vc_invite': {
          const row = new ActionRowBuilder().addComponents(
            new UserSelectMenuBuilder()
              .setCustomId('vc_invite_select')
              .setPlaceholder('招待するユーザーを選択')
              .setMinValues(1).setMaxValues(1),
          );
          await interaction.reply({ content: '招待するユーザーを選択してください:', components: [row], ephemeral: true });
          break;
        }
        case 'vc_claim': {
          const owner = interaction.guild.members.cache.get(tempRecord.owner_id);
          if (owner?.voice?.channelId === tempRecord.channel_id) {
            return interaction.reply({ content: 'オーナーがまだチャンネルにいるためクレームできません。', ephemeral: true });
          }
          tempChannels.updateOwner.run(interaction.user.id, tempRecord.channel_id);
          await interaction.reply({ content: `<@${interaction.user.id}> がチャンネルのオーナーになりました。` });
          break;
        }
        case 'vc_transfer': {
          const row = new ActionRowBuilder().addComponents(
            new UserSelectMenuBuilder()
              .setCustomId('vc_transfer_select')
              .setPlaceholder('オーナーを移譲するユーザーを選択')
              .setMinValues(1).setMaxValues(1),
          );
          await interaction.reply({ content: 'オーナーを移譲するユーザーを選択してください:', components: [row], ephemeral: true });
          break;
        }
      }
      return;
    }

    // User select menu interactions
    if (interaction.isUserSelectMenu()) {
      const tempRecord = db
        .prepare('SELECT * FROM temp_channels WHERE text_channel_id = ?')
        .get(interaction.channelId);
      if (!tempRecord || tempRecord.owner_id !== interaction.user.id) return;

      const voiceChannel = interaction.guild.channels.cache.get(tempRecord.channel_id);
      if (!voiceChannel) return;

      const targetId = interaction.values[0];

      if (interaction.customId === 'vc_kick_select') {
        if (targetId === interaction.user.id) {
          return interaction.update({ content: '自分自身はキックできません。', components: [] });
        }
        const target = interaction.guild.members.cache.get(targetId);
        if (target?.voice?.channelId === tempRecord.channel_id) {
          await target.voice.disconnect().catch(() => {});
          await interaction.update({ content: `<@${targetId}> をキックしました。`, components: [] });
        } else {
          await interaction.update({ content: 'そのユーザーはチャンネルにいません。', components: [] });
        }
      }

      if (interaction.customId === 'vc_invite_select') {
        if (targetId === interaction.user.id) {
          return interaction.update({ content: '自分自身は招待できません。', components: [] });
        }
        await voiceChannel.permissionOverwrites.edit(targetId, { Connect: true, ViewChannel: true }).catch(() => {});
        try {
          const user = await interaction.client.users.fetch(targetId);
          await user.send(`<@${interaction.user.id}> からボイスチャンネル **${voiceChannel.name}** (${interaction.guild.name}) に招待されました！`);
        } catch {}
        await interaction.update({ content: `<@${targetId}> を招待しました。`, components: [] });
      }

      if (interaction.customId === 'vc_transfer_select') {
        if (targetId === interaction.user.id) {
          return interaction.update({ content: '自分自身に移譲することはできません。', components: [] });
        }
        tempChannels.updateOwner.run(targetId, tempRecord.channel_id);
        await interaction.update({ content: `オーナーを <@${targetId}> に移譲しました。`, components: [] });
      }
    }
  },
};
