import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Talent } from '../../types/talent.ts'
import { parseTextWithLinks } from '../talentIconParser.tsx'

const talents = [{ id: '26WA001', generation: 2, name: '灯野ぺけ。' } as Talent]

function render(text: string): string {
  return renderToStaticMarkup(<>{parseTextWithLinks(text, talents, true)}</>)
}

describe('parseTextWithLinks', () => {
  it('Markdown リンク記法を新しいタブで開くリンクにする', () => {
    const html = render('詳しくは[ショートストーリー](https://example.com/ss?a=1)を読んでね')
    expect(html).toContain('<a href="https://example.com/ss?a=1"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('>ショートストーリー</a>')
    expect(html).toContain('詳しくは')
    expect(html).toContain('を読んでね')
  })

  it('リンク以外の部分にはタレントアイコンを付与する', () => {
    const html = render('灯野ぺけ。ちゃんの[お知らせ](https://example.com/)だよ')
    expect(html).toContain('灯野ぺけ。')
    expect(html).toContain('data/images/kv/sq/26WA001.png')
  })

  it('複数のリンクを変換する', () => {
    const html = render('[A](https://a.example/) と [B](https://b.example/)')
    expect(html).toContain('href="https://a.example/"')
    expect(html).toContain('href="https://b.example/"')
  })

  it('生の URL はリンクにしない', () => {
    const html = render('https://example.com/')
    expect(html).not.toContain('<a ')
    expect(html).toContain('https://example.com/')
  })

  it('http/https 以外のスキームはリンクにしない', () => {
    const html = render('[危険](javascript:alert(1))')
    expect(html).not.toContain('<a ')
    expect(html).toContain('javascript:alert(1)')
  })

  it('リンクを含まないテキストはそのまま扱う', () => {
    const html = render('今日はいい天気だね')
    expect(html).toContain('今日はいい天気だね')
    expect(html).not.toContain('<a ')
  })
})
