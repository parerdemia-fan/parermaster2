import { useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore.ts'
import { useTalents } from '../../shared/hooks/useTalents.ts'
import { useAwards } from '../../shared/hooks/useAwards.ts'
import type { Award } from '../../shared/types/award.ts'
import { getTalentImagePath, getTalentStandingPath } from '../../shared/utils/talent.ts'
import type { Talent } from '../../shared/types/talent.ts'

const BASE = import.meta.env.BASE_URL

const DORMITORIES = [
  { code: 'wa', name: 'バゥ寮', color: '#ef4444', gradient: 'linear-gradient(180deg, #f87171 0%, #ef4444 40%, #dc2626 100%)' },
  { code: 'me', name: 'ミュゥ寮', color: '#f472b6', gradient: 'linear-gradient(180deg, #f9a8d4 0%, #f472b6 40%, #e44d95 100%)' },
  { code: 'co', name: 'クゥ寮', color: '#22d3ee', gradient: 'linear-gradient(180deg, #67e8f9 0%, #22d3ee 40%, #0ea5cf 100%)' },
  { code: 'wh', name: 'ウィニー寮', color: '#22c55e', gradient: 'linear-gradient(180deg, #6ee7b7 0%, #22c55e 40%, #16a34a 100%)' },
] as const

const SNS_ICONS: Record<string, { icon: string; label: string; isImage: boolean }> = {
  official: { icon: `${BASE}data/images/ui/parerdemia-logo.png`, label: '公式ページ', isImage: true },
  x: { icon: '𝕏', label: 'X', isImage: false },
  youtube: { icon: `${BASE}data/images/ui/youtube.png`, label: 'YouTube', isImage: true },
  tiktok: { icon: `${BASE}data/images/ui/tiktok.png`, label: 'TikTok', isImage: true },
  marshmallow: { icon: `${BASE}data/images/ui/marshmallow.jpg`, label: 'マシュマロ', isImage: true },
}

const TEXT_SHADOW = '1px 1px 10px rgba(217,214,198,1), 1px -1px 10px rgba(217,214,198,1), -1px 1px 10px rgba(217,214,198,1), -1px -1px 10px rgba(217,214,198,1)'
const SECTION_FONT_SIZE = '3cqmin'
const DESC_FONT_SIZE = '2.5cqmin'

function getNameFontSize(text: string): string {
  const len = text.length
  if (len <= 5) return '3.5cqmin'
  if (len <= 6) return '3cqmin'
  if (len <= 9) return '2cqmin'
  return '1.6cqmin'
}

function getDetailNameFontSize(text: string): string {
  return `${Math.min(40 / text.length, 10)}cqmin`
}

const TAB_ACCENT = '#d6336c'

export function TalentListScreen() {
  const goToTitle = useSettingsStore((s) => s.goToTitle)
  const { talents } = useTalents()
  const { awards } = useAwards()
  const [selected, setSelected] = useState<Talent | null>(null)
  const [tab, setTab] = useState<1 | 2>(2)

  const filteredTalents = talents.filter((t) => t.generation === tab)
  const talentsByDorm = DORMITORIES.map((dorm) => ({
    ...dorm,
    talents: filteredTalents.filter((t) => t.dormitory === dorm.code),
  })).filter((dorm) => dorm.talents.length > 0)

  const handleSelect = (talent: Talent) => {
    const el = document.getElementById('profile-scroll')
    if (el) el.scrollTop = 0
    setSelected(talent)
  }

  return (
    <div className="w-full h-full flex flex-col animate-fade-in" style={{ overflow: 'visible' }}>
      {/* ヘッダー */}
      <div
        className="w-full flex items-center shrink-0"
        style={{ padding: '2cqmin 3cqmin 0' }}
      >
        <button
          className="font-bold cursor-pointer transition hover:brightness-110 active:scale-95"
          style={{
            fontSize: '4cqmin',
            padding: '1cqmin 2cqmin',
            borderRadius: '2cqmin',
            border: 'none',
            background: 'rgba(255,255,255,0.6)',
            color: '#555',
          }}
          onClick={goToTitle}
        >
          ◀ 戻る
        </button>
        <span
          className="font-bold"
          style={{
            fontSize: '5cqmin',
            marginLeft: '3cqmin',
            color: '#555',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          寮生一覧
        </span>

        {/* 世代タブ */}
        <div className="flex" style={{ gap: '1.5cqmin', marginLeft: 'auto' }}>
          {([1, 2] as const).map((gen) => (
            <button
              key={gen}
              className="font-bold cursor-pointer transition active:scale-95"
              style={{
                fontSize: '3.2cqmin',
                padding: '0.8cqmin 3cqmin',
                borderRadius: '5cqmin',
                border: tab === gen ? `0.3cqmin solid ${TAB_ACCENT}` : '0.3cqmin solid #ddd',
                background: tab === gen ? TAB_ACCENT : 'white',
                color: tab === gen ? 'white' : '#666',
                boxShadow: tab === gen ? '0 0.2cqmin 0.6cqmin rgba(0,0,0,0.12)' : 'none',
              }}
              onClick={() => { setTab(gen); setSelected(null) }}
            >
              {gen}期生
            </button>
          ))}
        </div>
      </div>

      {/* メインコンテンツ: 左右2分割 */}
      <div className="flex-1 flex overflow-hidden" style={{ gap: '2cqmin', padding: '2cqmin 2cqmin 2cqmin' }}>
        {/* 左側: 寮生一覧グリッド */}
        <div
          className="overflow-y-auto"
          style={{
            width: '50%',
            minHeight: 0,
            scrollbarWidth: 'none',
            borderRadius: '3cqmin',
            backgroundColor: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.1)',
            padding: '1cqmin',
          }}
        >
          {talentsByDorm.map((dorm, dormIdx) => (
            <div key={dorm.code} style={{ marginTop: dormIdx > 0 ? '2cqmin' : 0 }}>
              {/* 寮名ヘッダー */}
              <div
                className="font-bold text-white text-center"
                style={{
                  fontSize: '3.5cqmin',
                  padding: '1cqmin 0',
                  background: dorm.gradient,
                  borderRadius: '1.5cqmin 1.5cqmin 0 0',
                  border: '0.2cqmin solid rgba(255,255,255,0.4)',
                  borderBottom: 'none',
                  boxShadow: 'inset 0 0.4cqmin 0.6cqmin rgba(255,255,255,0.25)',
                  textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  letterSpacing: '0.1em',
                }}
              >
                {dorm.name}
              </div>

              {/* 寮生グリッド: 3列 */}
              <div
                className="grid"
                style={{
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1cqmin',
                  padding: '1cqmin',
                  background: 'rgba(0,0,0,0.08)',
                  borderRadius: '0 0 1.5cqmin 1.5cqmin',
                }}
              >
                {dorm.talents.map((talent) => {
                  const isSelected = selected?.id === talent.id
                  return (
                    <button
                      key={talent.id}
                      onClick={() => handleSelect(talent)}
                      className="relative w-full cursor-pointer transition-transform hover:scale-[1.02]"
                      style={{
                        aspectRatio: '1 / 1',
                        padding: 0,
                        border: 'none',
                        background: 'none',
                      }}
                    >
                      <img
                        src={getTalentImagePath(talent)}
                        draggable={false}
                        alt={talent.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                          borderRadius: '1cqmin',
                          boxShadow: isSelected ? '0 0 0 0.5cqmin #facc15' : '0 0.2cqmin 0.5cqmin rgba(0,0,0,0.1)',
                        }}
                      />
                      <div
                        className="absolute left-0 right-0 bottom-0 flex items-center justify-center"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          borderBottomLeftRadius: '1cqmin',
                          borderBottomRightRadius: '1cqmin',
                          padding: '0.3cqmin 0.5cqmin',
                          height: '4.5cqmin',
                        }}
                      >
                        <p
                          className="font-bold truncate w-full text-center"
                          style={{ fontSize: getNameFontSize(talent.name), color: '#374151' }}
                        >
                          {talent.name}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 右側: 寮生詳細 */}
        <div className="relative" style={{ width: '50%', minHeight: 0 }}>
          {/* 背景パネル */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: '3cqmin',
              boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.1)',
              zIndex: 0,
            }}
          />

          {/* スクロール可能なプロフィールエリア */}
          <div
            id="profile-scroll"
            className="overflow-y-auto relative"
            style={{
              width: '100%',
              height: '100%',
              scrollbarWidth: 'none',
              zIndex: 2,
            }}
          >
            {selected ? (
              <TalentDetail talent={selected} awards={awards.filter((a) => a.talentId === selected.id)} />
            ) : (
              <div
                className="flex items-center justify-center h-full font-bold"
                style={{ fontSize: '3cqmin', color: '#999' }}
              >
                寮生を選択してください
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 立ち絵（右パネル右端から1/3はみ出し） */}
      {selected && (
        <img
          src={getTalentStandingPath(selected)}
          alt={selected.name}
          className="absolute pointer-events-none"
          style={{
            width: '65cqmin',
            right: 'calc(50% - 90cqmin)',
            top: '-3cqmin',
            zIndex: 1,
          }}
          draggable={false}
        />
      )}
    </div>
  )
}

/* ── プロフィール詳細 ── */

function TalentDetail({ talent, awards }: { talent: Talent; awards: Award[] }) {
  const profileItems = [
    { label: '誕生日', value: talent.birthday },
    { label: '身長', value: talent.height ? `${talent.height}cm` : '' },
    { label: '学籍番号', value: talent.id },
    { label: 'ニックネーム', value: talent.nickname },
    { label: '一人称', value: talent.firstPerson },
    { label: 'ファンネーム', value: talent.fanName },
    { label: 'ファンマーク', value: talent.fanMark },
    { label: 'MBTIタイプ', value: talent.mbti },
  ].filter((item) => item.value)

  const listSections = [
    { label: '趣味', emoji: '🎮', items: talent.hobbies },
    { label: '特技', emoji: '🎤', items: talent.skills },
    { label: '好きなもの', emoji: '❤️', items: talent.favorites },
    { label: 'ハッシュタグ', emoji: '#', items: talent.hashtags.map((h) => h.tag) },
  ].filter((s) => s.items.length > 0)

  return (
    <div style={{ width: '64cqmin', padding: '3cqmin 4cqmin' }}>
      {/* 読み仮名 */}
      <p style={{ fontSize: '3cqmin', color: '#304056', textShadow: TEXT_SHADOW, marginBottom: '-0.5cqmin' }}>
        {talent.kana}
      </p>

      {/* 名前 */}
      <h2
        className="font-bold"
        style={{
          fontSize: getDetailNameFontSize(talent.name),
          color: '#1f2937',
          textShadow: TEXT_SHADOW,
          marginBottom: '1cqmin',
        }}
      >
        {talent.name}
      </h2>

      {/* SNSリンク */}
      {talent.links.length > 0 && (
        <div className="flex flex-wrap" style={{ gap: '1.5cqmin', marginBottom: '3cqmin' }}>
          {talent.links.map((link) => {
            const sns = SNS_ICONS[link.type]
            if (!sns) return null
            return (
              <a
                key={link.type}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center"
                style={{ width: '5cqmin', height: '5cqmin' }}
              >
                {sns.isImage ? (
                  <img
                    src={sns.icon}
                    alt={sns.label}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      borderRadius: link.type === 'official' || link.type === 'marshmallow' ? '50%' : '0',
                      backgroundColor: link.type === 'official' ? 'white' : 'transparent',
                    }}
                  />
                ) : (
                  <span
                    className="flex items-center justify-center rounded-full bg-black text-white"
                    style={{ width: '100%', height: '100%', fontSize: '3cqmin' }}
                  >
                    {sns.icon}
                  </span>
                )}
              </a>
            )
          })}
        </div>
      )}

      {/* 夢 */}
      {talent.dream && (
        <ProfileSection emoji="💫" title="夢">
          <p className="font-bold" style={{ fontSize: DESC_FONT_SIZE, color: '#29303c', textShadow: TEXT_SHADOW, paddingLeft: '3%', width: '40cqmin' }}>
            {talent.dream}
          </p>
        </ProfileSection>
      )}

      {/* キャッチフレーズ */}
      {talent.intro && (
        <ProfileSection emoji="📝" title="キャッチフレーズ">
          <p className="font-bold whitespace-pre-wrap" style={{ fontSize: DESC_FONT_SIZE, color: '#29303c', textShadow: TEXT_SHADOW, paddingLeft: '3%' }}>
            {talent.intro}
          </p>
        </ProfileSection>
      )}

      {/* 基本情報 */}
      {profileItems.length > 0 && (
        <ProfileSection emoji="📋" title="基本情報">
          <div
            className="grid"
            style={{
              gridTemplateColumns: 'auto 1fr',
              gap: '1cqmin',
              fontWeight: 'bold',
              fontSize: DESC_FONT_SIZE,
              paddingLeft: '3%',
            }}
          >
            {profileItems.map((item) => (
              <div key={item.label} className="contents">
                <span style={{ color: '#29303c', textShadow: TEXT_SHADOW }}>{item.label}</span>
                <span style={{ color: '#29303c', textShadow: TEXT_SHADOW }}>{item.value}</span>
              </div>
            ))}
          </div>
        </ProfileSection>
      )}

      {/* リスト系プロフィール */}
      {listSections.map((section) => (
        <ProfileSection key={section.label} emoji={section.emoji} title={section.label}>
          <div
            className="flex flex-wrap"
            style={{ gap: '1cqmin', fontWeight: 'bold', fontSize: DESC_FONT_SIZE, paddingLeft: '3%' }}
          >
            {section.items.map((item, idx) =>
              section.label === 'ハッシュタグ' ? (
                <a
                  key={idx}
                  href={`https://x.com/hashtag/${encodeURIComponent(item.replace(/^#/, ''))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: '#3b82f6', textShadow: TEXT_SHADOW }}
                >
                  {item}
                </a>
              ) : (
                <span key={idx} style={{ color: '#29303c', textShadow: TEXT_SHADOW }}>
                  {item}
                </span>
              ),
            )}
          </div>
        </ProfileSection>
      ))}

      {/* 受賞歴 */}
      {awards.length > 0 && (
        <ProfileSection emoji="🏆" title="受賞歴">
          <div
            className="flex flex-wrap"
            style={{ gap: '1cqmin', fontWeight: 'bold', fontSize: DESC_FONT_SIZE, paddingLeft: '3%' }}
          >
            {awards.map((a) => (
              <span key={a.id} style={{ color: '#29303c', textShadow: TEXT_SHADOW }}>
                {a.eventName} {a.result}
              </span>
            ))}
          </div>
        </ProfileSection>
      )}
    </div>
  )
}

/* ── プロフィールセクション ── */

function ProfileSection({
  emoji,
  title,
  children,
}: {
  emoji: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '1.5cqmin' }}>
      <h3
        className="font-bold"
        style={{
          fontSize: SECTION_FONT_SIZE,
          color: '#b45309',
          textShadow: TEXT_SHADOW,
          marginBottom: '1cqmin',
          paddingLeft: '1%',
        }}
      >
        {emoji} {title}
      </h3>
      {children}
    </div>
  )
}
