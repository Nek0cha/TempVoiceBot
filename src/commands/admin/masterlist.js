const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { masterChannels } = require('../../database');
const { config } = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('masterlist')
    .setDescription('登録されているマスターチャンネルの一覧を表示します')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const masters = masterChannels.getByGuild.all(interaction.guildId);
    if (masters.length === 0) {
      return interaction.reply({ content: config.messages.masterlistEmpty, ephemeral: true });
    }
    const lines = masters.map((m, i) => {
      const cat = m.category_id ? `カテゴリ: <#${m.category_id}>` : 'カテゴリなし';
      return `${i + 1}. <#${m.channel_id}> — テンプレート: \`${m.template}\` (${cat})`;
    });
    const embed = new EmbedBuilder()
      .setTitle(config.messages.masterlistTitle)
      .setColor(0x5865f2)
      .setDescription(lines.join('\n'));
    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

