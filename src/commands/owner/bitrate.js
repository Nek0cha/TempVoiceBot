const { SlashCommandBuilder } = require('discord.js');
const { getOwnedTempChannel } = require('../../utils/checks');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bitrate')
    .setDescription('一時チャンネルのビットレートを変更します')
    .addIntegerOption(opt =>
      opt.setName('value').setDescription('ビットレート (kbps, 8〜384)').setRequired(true).setMinValue(8).setMaxValue(384),
    ),

  async execute(interaction) {
    const tempRecord = getOwnedTempChannel(interaction.guildId, interaction.user.id);
    if (!tempRecord) {
      return interaction.reply({ content: '❌ あなたが所有する一時チャンネルが見つかりません。', ephemeral: true });
    }

    const voiceChannel = interaction.guild.channels.cache.get(tempRecord.channel_id);
    if (!voiceChannel) return interaction.reply({ content: '❌ チャンネルが見つかりません。', ephemeral: true });

    const kbps = interaction.options.getInteger('value');
    await voiceChannel.setBitrate(kbps * 1000);
    return interaction.reply({ content: `✅ ビットレートを ${kbps}kbps に設定しました。`, ephemeral: true });
  },
};
