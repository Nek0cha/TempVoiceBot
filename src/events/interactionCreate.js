'use strict';
const {
  UserSelectMenuBuilder, ActionRowBuilder,
  ModalBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');
const { db, tempChannels } = require('../database');
const { applyVCPermissions, syncTextChannel } = require('../utils/permissions');
const { config, format } = require('../config');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {

    // ── スラッシュコマンド ──────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(`Command error [${interaction.commandName}]:`, err);
        const msg = { content: config.messages.commandError, ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg);
        } else {
          await interaction.reply(msg);
        }
      }
      return;
    }

    // ── ボタン ──────────────────────────────────────────────────────────────
    if (interaction.isButton()) {
      const tempRecord = db
        .prepare('SELECT * FROM temp_channels WHERE text_channel_id = ?')
        .get(interaction.channelId);
      if (!tempRecord) return;

      // vc_claim だけは非オーナー（VC 参加中の誰でも）が操作可能
      if (interaction.customId !== 'vc_claim' && tempRecord.owner_id !== interaction.user.id) {
        return interaction.reply({ content: config.messages.ownerOnly, ephemeral: true });
      }

      const voiceChannel = interaction.guild.channels.cache.get(tempRecord.channel_id);

      switch (interaction.customId) {

        // ── ロック切り替え ──
        case 'vc_lock': {
          if (!voiceChannel) return interaction.reply({ content: config.messages.channelNotFound, ephemeral: true });
          const newVal = tempRecord.is_locked ? 0 : 1;
          tempChannels.updateLocked.run(newVal, tempRecord.channel_id);
          const updated = tempChannels.getByChannel.get(tempRecord.channel_id);
          await applyVCPermissions(voiceChannel, interaction.guild, updated);
          return interaction.reply({
            content: newVal ? config.messages.locked : config.messages.unlocked,
            ephemeral: true,
          });
        }

        // ── 非公開切り替え（hide/show を統合）──
        case 'vc_private': {
          if (!voiceChannel) return interaction.reply({ content: config.messages.channelNotFound, ephemeral: true });
          const newVal = tempRecord.is_private ? 0 : 1;
          tempChannels.updatePrivate.run(newVal, tempRecord.channel_id);
          const updated = tempChannels.getByChannel.get(tempRecord.channel_id);
          await applyVCPermissions(voiceChannel, interaction.guild, updated);
          return interaction.reply({
            content: newVal ? config.messages.madePrivate : config.messages.madePublic,
            ephemeral: true,
          });
        }

        // ── 名前変更（モーダル）──
        case 'vc_rename': {
          const m = config.modals.rename;
          const modal = new ModalBuilder().setCustomId('vc_rename_modal').setTitle(m.title);
          modal.addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('vc_rename_input')
                .setLabel(m.inputLabel)
                .setPlaceholder(m.placeholder)
                .setStyle(TextInputStyle.Short)
                .setMinLength(1).setMaxLength(100).setRequired(true),
            ),
          );
          return interaction.showModal(modal);
        }

        // ── 人数制限（モーダル）──
        case 'vc_limit': {
          const m = config.modals.limit;
          const modal = new ModalBuilder().setCustomId('vc_limit_modal').setTitle(m.title);
          modal.addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('vc_limit_input')
                .setLabel(m.inputLabel)
                .setPlaceholder(m.placeholder)
                .setStyle(TextInputStyle.Short)
                .setMinLength(1).setMaxLength(2).setRequired(true),
            ),
          );
          return interaction.showModal(modal);
        }

        // ── ビットレート（モーダル）──
        case 'vc_bitrate': {
          const m = config.modals.bitrate;
          const modal = new ModalBuilder().setCustomId('vc_bitrate_modal').setTitle(m.title);
          modal.addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('vc_bitrate_input')
                .setLabel(m.inputLabel)
                .setPlaceholder(m.placeholder)
                .setStyle(TextInputStyle.Short)
                .setMinLength(1).setMaxLength(3).setRequired(true),
            ),
          );
          return interaction.showModal(modal);
        }

        // ── キック（ユーザー選択）──
        case 'vc_kick': {
          const row = new ActionRowBuilder().addComponents(
            new UserSelectMenuBuilder()
              .setCustomId('vc_kick_select')
              .setPlaceholder(config.messages.phKick)
              .setMinValues(1).setMaxValues(1),
          );
          return interaction.reply({ content: config.messages.selectKick, components: [row], ephemeral: true });
        }

        // ── BAN（ユーザー選択）──
        case 'vc_ban': {
          const row = new ActionRowBuilder().addComponents(
            new UserSelectMenuBuilder()
              .setCustomId('vc_ban_select')
              .setPlaceholder(config.messages.phBan)
              .setMinValues(1).setMaxValues(1),
          );
          return interaction.reply({ content: config.messages.selectBan, components: [row], ephemeral: true });
        }

        // ── 招待（ユーザー選択）──
        case 'vc_invite': {
          const row = new ActionRowBuilder().addComponents(
            new UserSelectMenuBuilder()
              .setCustomId('vc_invite_select')
              .setPlaceholder(config.messages.phInvite)
              .setMinValues(1).setMaxValues(1),
          );
          return interaction.reply({ content: config.messages.selectInvite, components: [row], ephemeral: true });
        }

        // ── クレーム（オーナー不在時に誰でも実行可能）──
        case 'vc_claim': {
          if (interaction.member.voice?.channelId !== tempRecord.channel_id) {
            return interaction.reply({ content: config.messages.claimNotInVC, ephemeral: true });
          }
          if (tempRecord.owner_id === interaction.user.id) {
            return interaction.reply({ content: config.messages.claimAlreadyOwner, ephemeral: true });
          }
          if (voiceChannel?.members.has(tempRecord.owner_id)) {
            return interaction.reply({ content: config.messages.claimOwnerPresent, ephemeral: true });
          }
          tempChannels.updateOwner.run(interaction.user.id, tempRecord.channel_id);
          const textCh = interaction.guild.channels.cache.get(tempRecord.text_channel_id);
          if (voiceChannel && textCh) {
            await syncTextChannel(voiceChannel, textCh, interaction.user.id).catch(() => {});
          }
          return interaction.reply({
            content: format(config.messages.claimAnnounce, { user: interaction.user.id }),
          });
        }

        // ── 移譲（ユーザー選択）──
        case 'vc_transfer': {
          const row = new ActionRowBuilder().addComponents(
            new UserSelectMenuBuilder()
              .setCustomId('vc_transfer_select')
              .setPlaceholder(config.messages.phTransfer)
              .setMinValues(1).setMaxValues(1),
          );
          return interaction.reply({ content: config.messages.selectTransfer, components: [row], ephemeral: true });
        }
      }
      return;
    }

    // ── モーダル送信 ────────────────────────────────────────────────────────
    if (interaction.isModalSubmit()) {
      const tempRecord = db
        .prepare('SELECT * FROM temp_channels WHERE text_channel_id = ?')
        .get(interaction.channelId);
      if (!tempRecord || tempRecord.owner_id !== interaction.user.id) return;

      const voiceChannel = interaction.guild.channels.cache.get(tempRecord.channel_id);
      if (!voiceChannel) return interaction.reply({ content: config.messages.channelNotFound, ephemeral: true });

      if (interaction.customId === 'vc_rename_modal') {
        const name = interaction.fields.getTextInputValue('vc_rename_input').trim();
        if (!name) return interaction.reply({ content: config.messages.renameInvalid, ephemeral: true });
        await voiceChannel.setName(name);
        return interaction.reply({
          content: format(config.messages.renamed, { name }),
          ephemeral: true,
        });
      }

      if (interaction.customId === 'vc_limit_modal') {
        const n = parseInt(interaction.fields.getTextInputValue('vc_limit_input').trim(), 10);
        if (isNaN(n) || n < 0 || n > 99) {
          return interaction.reply({ content: config.messages.limitInvalid, ephemeral: true });
        }
        await voiceChannel.setUserLimit(n);
        return interaction.reply({
          content: format(config.messages.limitSet, { limit: n === 0 ? '無制限' : `${n}人` }),
          ephemeral: true,
        });
      }

      if (interaction.customId === 'vc_bitrate_modal') {
        const kbps = parseInt(interaction.fields.getTextInputValue('vc_bitrate_input').trim(), 10);
        if (isNaN(kbps) || kbps < 8 || kbps > 384) {
          return interaction.reply({ content: config.messages.bitrateInvalid, ephemeral: true });
        }
        await voiceChannel.setBitrate(kbps * 1000);
        return interaction.reply({
          content: format(config.messages.bitrateSet, { kbps }),
          ephemeral: true,
        });
      }
      return;
    }

    // ── ユーザー選択メニュー ────────────────────────────────────────────────
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
          return interaction.update({ content: config.messages.kickSelf, components: [] });
        }
        const target = interaction.guild.members.cache.get(targetId);
        if (target?.voice?.channelId === tempRecord.channel_id) {
          await target.voice.disconnect().catch(() => {});
          return interaction.update({
            content: format(config.messages.kicked, { user: targetId }),
            components: [],
          });
        }
        return interaction.update({ content: config.messages.kickNotIn, components: [] });
      }

      if (interaction.customId === 'vc_ban_select') {
        if (targetId === interaction.user.id) {
          return interaction.update({ content: config.messages.banSelf, components: [] });
        }
        tempChannels.addBan(tempRecord.channel_id, targetId);
        const updated = tempChannels.getByChannel.get(tempRecord.channel_id);
        await applyVCPermissions(voiceChannel, interaction.guild, updated);
        const target = interaction.guild.members.cache.get(targetId);
        if (target?.voice?.channelId === tempRecord.channel_id) {
          await target.voice.disconnect().catch(() => {});
        }
        return interaction.update({
          content: format(config.messages.banned, { user: targetId }),
          components: [],
        });
      }

      if (interaction.customId === 'vc_invite_select') {
        if (targetId === interaction.user.id) {
          return interaction.update({ content: config.messages.inviteSelf, components: [] });
        }
        await voiceChannel.permissionOverwrites.edit(targetId, { Connect: true, ViewChannel: true }).catch(() => {});
        try {
          const user = await interaction.client.users.fetch(targetId);
          await user.send(format(config.messages.inviteDm, {
            owner:   interaction.user.displayName,
            channel: voiceChannel.name,
            guild:   interaction.guild.name,
          }));
        } catch {}
        return interaction.update({
          content: format(config.messages.invited, { user: targetId }),
          components: [],
        });
      }

      if (interaction.customId === 'vc_transfer_select') {
        if (targetId === interaction.user.id) {
          return interaction.update({ content: config.messages.transferSelf, components: [] });
        }
        tempChannels.updateOwner.run(targetId, tempRecord.channel_id);
        const textChannel = interaction.guild.channels.cache.get(tempRecord.text_channel_id);
        if (textChannel) {
          await syncTextChannel(voiceChannel, textChannel, targetId).catch(() => {});
        }
        return interaction.update({
          content: format(config.messages.transferred, { user: targetId }),
          components: [],
        });
      }
    }
  },
};


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
