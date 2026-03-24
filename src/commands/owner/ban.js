const { SlashCommandBuilder } = require('discord.js');
const { tempChannels } = require('../../database');
const { getOwnedTempChannel } = require('../../utils/checks');
const { applyVCPermissions } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('一時チャンネルへのユーザーの接続を禁止します')
    .addUserOption(opt =>
      opt.setName('user').setDescription('対象ユーザー').setRequired(true),
    ),

  async execute(interaction) {
    const tempRecord = getOwnedTempChannel(interaction.guildId, interaction.user.id);
    if (!tempRecord) {
      return interaction.reply({ content: '❌ あなたが所有する一時チャンネルが見つかりません。', ephemeral: true });
    }

    const target = interaction.options.getMember('user');
    if (!target) return interaction.reply({ content: '❌ ユーザーが見つかりません。', ephemeral: true });
    if (target.id === interaction.user.id) {
      return interaction.reply({ content: '❌ 自分自身はBANできません。', ephemeral: true });
    }

    const voiceChannel = interaction.guild.channels.cache.get(tempRecord.channel_id);
    if (!voiceChannel) return interaction.reply({ content: '❌ チャンネルが見つかりません。', ephemeral: true });

    tempChannels.addBan(tempRecord.channel_id, target.id);
    const updated = tempChannels.getByChannel.get(tempRecord.channel_id);
    await applyVCPermissions(voiceChannel, interaction.guild, updated);

    if (target.voice?.channelId === tempRecord.channel_id) {
      await target.voice.disconnect().catch(() => {});
    }

    return interaction.reply({ content: `🚫 <@${target.id}> をBANしました。`, ephemeral: true });
  },
};
