const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { masterChannels } = require('../../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setcategory')
    .setDescription('一時チャンネルを生成するカテゴリを設定します')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(opt =>
      opt.setName('master')
        .setDescription('対象のマスターチャンネル')
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(true),
    )
    .addChannelOption(opt =>
      opt.setName('category')
        .setDescription('生成先カテゴリ')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true),
    ),

  async execute(interaction) {
    const master   = interaction.options.getChannel('master');
    const category = interaction.options.getChannel('category');

    const masterRecord = masterChannels.getByChannel.get(master.id);
    if (!masterRecord || masterRecord.guild_id !== interaction.guildId) {
      return interaction.reply({
        content: '❌ 指定したチャンネルはマスターチャンネルではありません。',
        ephemeral: true,
      });
    }

    masterChannels.updateCategory.run(category.id, master.id);

    return interaction.reply({
      content: `✅ カテゴリを <#${category.id}> に設定しました。`,
      ephemeral: true,
    });
  },
};
