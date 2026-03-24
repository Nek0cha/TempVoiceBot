const { SlashCommandBuilder } = require('discord.js');
const { getOwnedTempChannel } = require('../../utils/checks');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('limit')
    .setDescription('一時チャンネルの人数制限を設定します（0で無制限）')
    .addIntegerOption(opt =>
      opt.setName('number').setDescription('人数制限 (0〜99)').setRequired(true).setMinValue(0).setMaxValue(99),
    ),

  async execute(interaction) {
    const tempRecord = getOwnedTempChannel(interaction.guildId, interaction.user.id);
    if (!tempRecord) {
      return interaction.reply({ content: '❌ あなたが所有する一時チャンネルが見つかりません。', ephemeral: true });
    }

    const voiceChannel = interaction.guild.channels.cache.get(tempRecord.channel_id);
    if (!voiceChannel) return interaction.reply({ content: '❌ チャンネルが見つかりません。', ephemeral: true });

    const limit = interaction.options.getInteger('number');
    await voiceChannel.setUserLimit(limit);
    return interaction.reply({
      content: `✅ 人数制限を ${limit === 0 ? '無制限' : `${limit}人`} に設定しました。`,
      ephemeral: true,
    });
  },
};
