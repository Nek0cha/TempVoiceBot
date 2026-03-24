const { SlashCommandBuilder } = require('discord.js');
const { getOwnedTempChannel } = require('../../utils/checks');
const { config, format } = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rename')
    .setDescription('一時チャンネルの名前を変更します')
    .addStringOption(opt =>
      opt.setName('name').setDescription('新しい名前').setRequired(true).setMaxLength(100),
    ),

  async execute(interaction) {
    const tempRecord = getOwnedTempChannel(interaction.guildId, interaction.user.id);
    if (!tempRecord) {
      return interaction.reply({ content: config.messages.noOwnedChannel, ephemeral: true });
    }
    const voiceChannel = interaction.guild.channels.cache.get(tempRecord.channel_id);
    if (!voiceChannel) return interaction.reply({ content: config.messages.channelNotFound, ephemeral: true });

    const name = interaction.options.getString('name');
    await voiceChannel.setName(name);
    return interaction.reply({
      content: format(config.messages.renamed, { name }),
      ephemeral: true,
    });
  },
};

