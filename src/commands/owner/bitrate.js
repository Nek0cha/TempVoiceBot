const { SlashCommandBuilder } = require('discord.js');
const { getOwnedTempChannel } = require('../../utils/checks');
const { config, format } = require('../../config');

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
      return interaction.reply({ content: config.messages.noOwnedChannel, ephemeral: true });
    }
    const voiceChannel = interaction.guild.channels.cache.get(tempRecord.channel_id);
    if (!voiceChannel) return interaction.reply({ content: config.messages.channelNotFound, ephemeral: true });

    const kbps = interaction.options.getInteger('value');
    await voiceChannel.setBitrate(kbps * 1000);
    return interaction.reply({
      content: format(config.messages.bitrateSet, { kbps }),
      ephemeral: true,
    });
  },
};

