const { SlashCommandBuilder } = require('discord.js');
const { getOwnedTempChannel } = require('../../utils/checks');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('一時チャンネルからユーザーを切断します')
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
      return interaction.reply({ content: '❌ 自分自身はキックできません。', ephemeral: true });
    }
    if (target.voice.channelId !== tempRecord.channel_id) {
      return interaction.reply({ content: '❌ そのユーザーはチャンネルにいません。', ephemeral: true });
    }

    await target.voice.disconnect();
    return interaction.reply({ content: `👢 <@${target.id}> をチャンネルから切断しました。`, ephemeral: true });
  },
};
