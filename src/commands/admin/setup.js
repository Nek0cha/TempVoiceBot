const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { masterChannels } = require('../../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('マスターチャンネルを設定します')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('新しいマスターチャンネルを作成して登録します')
        .addStringOption(opt =>
          opt.setName('name').setDescription('チャンネル名').setRequired(true),
        )
        .addChannelOption(opt =>
          opt.setName('category')
            .setDescription('配置するカテゴリ（省略すると一時チャンネルも同じカテゴリに生成）')
            .addChannelTypes(ChannelType.GuildCategory),
        ),
    )
    .addSubcommand(sub =>
      sub.setName('register')
        .setDescription('既存のボイスチャンネルをマスターとして登録します')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('マスターチャンネルにするVC')
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true),
        ),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'create') {
      const name     = interaction.options.getString('name');
      const category = interaction.options.getChannel('category');

      const channel = await interaction.guild.channels.create({
        name,
        type: ChannelType.GuildVoice,
        parent: category ?? null,
      });

      masterChannels.upsert.run({ guildId: interaction.guildId, channelId: channel.id, categoryId: category?.id ?? null, template: '%owner%のチャンネル' });

      return interaction.reply({
        content: `✅ マスターチャンネル <#${channel.id}> を作成しました。`,
        ephemeral: true,
      });
    }

    if (sub === 'register') {
      const channel = interaction.options.getChannel('channel');

      masterChannels.upsert.run({ guildId: interaction.guildId, channelId: channel.id, categoryId: channel.parentId ?? null, template: '%owner%のチャンネル' });

      return interaction.reply({
        content: `✅ <#${channel.id}> をマスターチャンネルとして登録しました。`,
        ephemeral: true,
      });
    }
  },
};
