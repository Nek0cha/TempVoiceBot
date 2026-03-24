'use strict';

/**
 * TempVoice 設定ファイル
 * ───────────────────────────────────────────────────────────────────────────
 * このファイルでボット内のすべてのメッセージ・ボタン・モーダルテキストを変更できます。
 *
 * メッセージ中のプレースホルダー（{user} など）は format() 関数で展開されます。
 * 絵文字は Discord 絵文字名（:emoji:）または Unicode 絵文字が使えます。
 */

const config = {

  // ── パネル ──────────────────────────────────────────────────────────────
  panel: {
    /** 一時VC作成時にテキストチャンネルへ送るメッセージ。{owner} = オーナーメンション */
    welcomeMessage: '👋 <@{owner}> の一時チャンネルが作成されました。',
    /**
     * テキストチャンネルの名前テンプレート。
     * 使用可能なプレースホルダー:
     *   {vcname}   — 作成されたVCの名前
     *   {owner}    — オーナーの表示名
     *   {counter}  — ギルド内連番
     * 最大100文字に自動トリム。
     */
    textChannelTemplate: '{owner}の聞き専',
  },

  // ── ボタンラベル ─────────────────────────────────────────────────────────
  buttons: {
    lock:     { label: 'ロック',          emoji: '🔒' },
    private:  { label: '非公開/公開',     emoji: '🔐' },
    rename:   { label: '名前変更',        emoji: '✏️'  },
    limit:    { label: '人数制限',        emoji: '👥'  },
    bitrate:  { label: 'ビットレート',    emoji: '📡'  },
    kick:     { label: 'キック',          emoji: '👢'  },
    ban:      { label: 'BAN',             emoji: '🚫'  },
    invite:   { label: '招待',            emoji: '📨'  },
    claim:    { label: '取得',        emoji: '🏳️'  },
    transfer: { label: '譲る',            emoji: '🔄'  },
  },

  // ── モーダル ─────────────────────────────────────────────────────────────
  modals: {
    rename: {
      title:       'チャンネル名を変更',
      inputLabel:  '新しいチャンネル名',
      placeholder: '例: みんなの部屋',
    },
    limit: {
      title:       '人数制限を設定',
      inputLabel:  '人数（0 = 無制限）',
      placeholder: '0〜99',
    },
    bitrate: {
      title:       'ビットレートを設定',
      inputLabel:  'ビットレート (kbps)',
      placeholder: '8〜384',
    },
  },

  // ── メッセージ ─────────────────────────────────────────────────────────
  // {変数名} はプレースホルダーです。format() で展開されます。
  messages: {

    // 共通
    noOwnedChannel:    '❌ あなたが所有する一時チャンネルが見つかりません。',
    channelNotFound:   '❌ ボイスチャンネルが見つかりません。',
    ownerOnly:         '❌ チャンネルのオーナーのみ操作できます。',
    userNotFound:      '❌ ユーザーが見つかりません。',
    commandError:      'コマンドの実行中にエラーが発生しました。',

    // ── ロック ──
    locked:            '🔒 チャンネルをロックしました。',
    unlocked:          '🔓 ロックを解除しました。',

    // ── 非公開 ──
    madePrivate:       '🔐 チャンネルを非公開にしました。`/invite @user` で招待できます。',
    madePublic:        '🌐 チャンネルを公開しました。',

    // ── 名前変更  {name} = 新しい名前 ──
    renamed:           '✅ チャンネル名を `{name}` に変更しました。',
    renameInvalid:     '❌ 名前は1〜100文字で入力してください。',

    // ── 人数制限  {limit} = "無制限" または "{n}人" ──
    limitSet:          '✅ 人数制限を {limit} に設定しました。',
    limitInvalid:      '❌ 0〜99 の整数を入力してください。',

    // ── ビットレート  {kbps} = 数値 ──
    bitrateSet:        '✅ ビットレートを {kbps}kbps に設定しました。',
    bitrateInvalid:    '❌ 8〜384 の整数を入力してください。',

    // ── キック  {user} = ユーザーID ──
    kicked:            '👢 <@{user}> をチャンネルから切断しました。',
    kickSelf:          '❌ 自分自身はキックできません。',
    kickNotIn:         '❌ そのユーザーはチャンネルにいません。',

    // ── BAN  {user} = ユーザーID ──
    banned:            '🚫 <@{user}> をBANしました。',
    banSelf:           '❌ 自分自身はBANできません。',

    // ── 招待  {user} = ユーザーID ──
    invited:           '✅ <@{user}> を招待しました。',
    inviteSelf:        '❌ 自分自身は招待できません。',
    /** DM本文。{owner} = 送信者表示名, {channel} = VC名, {guild} = サーバー名 */
    inviteDm:          '📩 {owner} からボイスチャンネル **{channel}** ({guild}) に招待されました！',

    // ── クレーム  {user} = ユーザーID ──
    claimed:           '✅ チャンネルの所有権を取得しました。',
    claimAnnounce:     '🏳️ <@{user}> がチャンネルのオーナーになりました。',
    claimNotInVC:      '❌ このチャンネルのボイスチャンネルに参加していません。',
    claimNotTempVC:    '❌ このチャンネルは一時チャンネルではありません。',
    claimAlreadyOwner: '❌ あなたはすでにオーナーです。',
    claimOwnerPresent: '❌ 現在のオーナーがまだチャンネルにいます。',

    // ── 移譲  {user} = ユーザーID ──
    transferred:       '✅ <@{user}> にチャンネルの所有権を譲渡しました。',
    transferSelf:      '❌ 自分自身には譲渡できません。',

    // ── セレクトメニュー誘導文 / プレースホルダー ──
    selectKick:        'キックするユーザーを選択してください:',
    phKick:            'キックするユーザーを選択',
    selectBan:         'BANするユーザーを選択してください:',
    phBan:             'BANするユーザーを選択',
    selectInvite:      '招待するユーザーを選択してください:',
    phInvite:          '招待するユーザーを選択',
    selectTransfer:    'オーナーを移譲するユーザーを選択してください:',
    phTransfer:        'オーナーを移譲するユーザーを選択',

    // ── 管理者 ──
    /** {channel} = チャンネルID */
    setupCreated:      '✅ マスターチャンネル <#{channel}> を作成しました。',
    setupRegistered:   '✅ <#{channel}> をマスターチャンネルとして登録しました。',
    masterlistEmpty:   'マスターチャンネルが登録されていません。`/setup` で登録してください。',
    masterlistTitle:   '📋 マスターチャンネル一覧',
    notMasterChannel:  '❌ 指定したチャンネルはマスターチャンネルではありません。',
    /** {template} = テンプレート文字列 */
    templateSet:       '✅ テンプレートを `{template}` に設定しました。',
    /** {category} = カテゴリID */
    categorySet:       '✅ カテゴリを <#{category}> に設定しました。',
  },
};

/**
 * テンプレート文字列内の {key} を vars の値で置換します。
 * @param {string} str  - config.messages／panel のテンプレート文字列
 * @param {Object} vars - 変数名 → 値 のマッピング
 * @returns {string}
 */
function format(str, vars = {}) {
  return str.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
}

module.exports = { config, format };
