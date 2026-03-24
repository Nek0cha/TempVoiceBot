const { SlashCommandBuilder } = require('discord.js');
const { tempChannels } = require('../../database');
const { syncTextChannel } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('claim')
    .setDescription('オーナーが退出した一時チャンネルの所有権を取得します'),

  async execute(interaction) {
    const member = interaction.member;
    if (!member.voice.channel) {
      return interaction.reply({ content: '❌ ボイスチャンネルに参加していません。', ephemeral: true });
    }

    const voiceChannelId = member.voice.channel.id;
    const tempRecord = tempChannels.getByChannel.get(voiceChannelId);
    if (!tempRecord) {
      return interaction.reply({ content: '❌ このチャンネルは一時チャンネルではありません。', ephemeral: true });
    }
    if (tempRecord.owner_id === interaction.user.id) {
      return interaction.reply({ content: '❌ あなたはすでにオーナーです。', ephemeral: true });
    }
    if (member.voice.channel.members.has(tempRecord.owner_id)) {
      return interaction.reply({ content: '❌ 現在のオーナーがまだチャンネルにいます。', ephemeral: true });
    }

    tempChannels.updateOwner.run(interaction.user.id, voiceChannelId);

    const textChannel = interaction.guild.channels.cache.get(tempRecord.text_channel_id);
    if (textChannel) {
      await syncTextChannel(member.voice.channel, textChannel, interaction.user.id).catch(() => {});
    }

    return interaction.reply({ content: '✅ チャンネルの所有権を取得しました。', ephemeral: true });
  },
};
