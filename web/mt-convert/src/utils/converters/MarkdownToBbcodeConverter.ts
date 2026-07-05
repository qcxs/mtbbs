import { marked, Renderer } from 'marked'
import { type ConverterSettings, loadSettings, renderTemplate, removeEmoji, DEFAULT_SETTINGS } from '@/utils/converterSettings'
import { MAX_HEADING_LEVEL, HEADING_BASE_SIZE } from '@/utils/constants'

const HTML_ENTITIES: Record<string, string> = {
  '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&#39;': "'"
}

function unescapeHtml(text: string): string {
  return text.replace(/&(?:lt|gt|amp|quot|#39);/g, m => HTML_ENTITIES[m] || m)
}

export class MarkdownToBbcodeConverter {
  private renderer: Renderer
  private settings: ConverterSettings
  private headingCounters: number[] = Array(MAX_HEADING_LEVEL).fill(0)

  constructor(settings?: ConverterSettings) {
    this.settings = settings || loadSettings()
    this.renderer = new Renderer()
    this.configureRenderer()
  }

  updateSettings(settings: ConverterSettings): void {
    this.settings = settings
    this.configureRenderer()
  }

  private resetCounters(level: number): void {
    for (let i = level; i < MAX_HEADING_LEVEL; i++) {
      this.headingCounters[i] = 0
    }
  }

  private getHeadingNumber(level: number): string {
    this.headingCounters[level - 1]++
    this.resetCounters(level)
    return this.headingCounters.slice(0, level).join('.')
  }

  private configureRenderer(): void {
    const s = this.settings

    this.renderer.paragraph = (text: string) => renderTemplate(s.paragraph, { text }) + '\n'

    this.renderer.heading = (text: string, level: number) => {
      let displayText = text
      if (s.autoNumbering) {
        const num = this.getHeadingNumber(Math.min(level, MAX_HEADING_LEVEL))
        displayText = `${num} ${text}`
      }
      const clampedLevel = Math.min(level, MAX_HEADING_LEVEL)
      const size = String(HEADING_BASE_SIZE - clampedLevel)
      const key = `heading${clampedLevel}` as keyof ConverterSettings
      const tmpl = (s[key] as string) || DEFAULT_SETTINGS[key] as string
      return renderTemplate(tmpl, { text: displayText, level: String(level), size }) + '\n'
    }

    this.renderer.strong = (text: string) => renderTemplate(s.strong, { text })

    this.renderer.em = (text: string) => renderTemplate(s.em, { text })

    this.renderer.del = (text: string) => renderTemplate(s.del, { text })

    this.renderer.br = () => '\n'

    this.renderer.codespan = (text: string) => renderTemplate(s.codespan, { text })

    this.renderer.code = (text: string, lang: string) => renderTemplate(s.code, { text: text.trim(), lang })

    this.renderer.blockquote = (text: string) => {
      const cleaned = text.trim().replace(/\[quote\]\s*|\s*\[\/quote\]/g, '\n').replace(/\n+/g, '\n').trim()
      return renderTemplate(s.blockquote, { text: cleaned }) + '\n'
    }

    this.renderer.hr = () => renderTemplate(s.hr, {}) + '\n'

    this.renderer.link = (_href: string, _title: string | null, text: string) => {
      const href = _href || text
      const title = _title || ''
      if (href.startsWith('mailto:')) {
        const email = href.replace(/^mailto:/i, '')
        const displayText = text.replace(/^mailto:/i, '')
        if (displayText === email) {
          return `[email]${email}[/email]`
        }
        return `[email=${email}]${displayText}[/email]`
      }
      return renderTemplate(s.link, { text, href, title })
    }

    this.renderer.image = (_href: string, _title: string | null, text: string) => {
      const href = _href || ''
      return renderTemplate(s.image, { href, text })
    }

    this.renderer.list = (body: string, ordered: boolean) => {
      const tag = ordered ? 'list=1' : 'list'
      return renderTemplate(s.list, { body, tag }) + '\n'
    }

    this.renderer.listitem = (text: string) => renderTemplate(s.listitem, { text }) + '\n'

    this.renderer.table = (header: string, body: string) => renderTemplate(s.table, { header, body }) + '\n'

    this.renderer.tablerow = (content: string) => renderTemplate(s.tablerow, { content }) + '\n'

    this.renderer.tablecell = (content: string) => {
      const cleaned = content.replace(/<br\s*\/?>/gi, '\n')
      return renderTemplate(s.tablecell, { content: unescapeHtml(cleaned) })
    }
  }

  convert(markdown: string): string {
    if (!markdown || typeof markdown !== 'string') {
      return ''
    }

    let input = markdown.trim()

    this.headingCounters = Array(MAX_HEADING_LEVEL).fill(0)

    if (this.settings.removeEmoji) {
      input = removeEmoji(input)
    }

    let freeBlock = ''
    const fmMatch = input.match(/^---\s*\n([\s\S]*?)\n---\s*\n*/)
    if (fmMatch) {
      freeBlock = `[free]\n${fmMatch[1].trim()}\n[/free]\n`
      input = input.slice(fmMatch[0].length).trimStart()
    }

    marked.setOptions({
      renderer: this.renderer,
      gfm: true,
      breaks: false
    })

    let result = marked(input)

    if (freeBlock) {
      result = freeBlock + result
    }

    result = this.processHighlights(result)
    result = this.processTaskLists(input, result)
    result = this.cleanResult(result)

    return result.trim()
  }

  private processHighlights(text: string): string {
    return text.replace(/==(.+?)==/g, '[color=#000000][backcolor=#FFFF00]$1[/backcolor][/color]')
  }

  private processTaskLists(original: string, converted: string): string {
    const lines = original.split('\n')
    const convertedLines = converted.split('\n')

    let taskListIndex = 0

    for (let i = 0; i < lines.length; i++) {
      const originalLine = lines[i]
      const taskMatch = originalLine.match(/^\s*- \[(x| )\]\s+(.+)$/)

      if (taskMatch) {
        const checked = taskMatch[1] === 'x'
        
        while (taskListIndex < convertedLines.length && 
               !/\[\*\]\s*<input/i.test(convertedLines[taskListIndex])) {
          taskListIndex++
        }

        if (taskListIndex < convertedLines.length) {
          convertedLines[taskListIndex] = convertedLines[taskListIndex].replace(
            /\[\*\]\s*<input[^>]*>/,
            `[*] ${checked ? '[✓]' : '[✗]'}`
          )
          taskListIndex++
        }
      }
    }

    return convertedLines.join('\n')
  }

  private cleanResult(text: string): string {
    text = text.replace(/\n{2,}/g, '\n')
    text = text.replace(/\[([a-z]+)\]\n+/gi, '[$1]')
    text = text.replace(/\n+\[\/([a-z]+)\]/gi, '[/$1]')
    return text.trim()
  }
}

export const markdownToBbcodeConverter = new MarkdownToBbcodeConverter()
