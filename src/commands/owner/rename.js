const { SlashCommandBuilder } = require('discord.js');
const { getOwnedTempChannel } = require('../../utils/checks');

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
      return interaction.reply({ content: '❌ あなたが所有する一時チャンネルが見つかりません。', ephemeral: true });
    }

    const voiceChannel = interaction.guild.channels.cache.get(tempRecord.channel_id);
    if (!voiceChannel) return interaction.reply({ content: '❌ チャンネルが見つかりません。', ephemeral: true });

    const name = interaction.options.getString('name');
    await voiceChannel.setName(name);
    return interaction.reply({ content: `✅ チャンネル名を \`${name}\` に変更しました。`, ephemeral: true });
  },
};
