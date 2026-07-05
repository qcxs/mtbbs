export interface ConverterSettings {
  heading1: string
  heading2: string
  heading3: string
  paragraph: string
  strong: string
  em: string
  del: string
  codespan: string
  code: string
  blockquote: string
  hr: string
  link: string
  image: string
  list: string
  listitem: string
  table: string
  tablerow: string
  tablecell: string
  removeEmoji: boolean
  autoNumbering: boolean
}

const STORAGE_KEY = 'mt-convert-md-settings'

export const DEFAULT_SETTINGS: ConverterSettings = {
  heading1: '[size=${size}][b]${text}[/b][/size]',
  heading2: '[size=${size}][b]${text}[/b][/size]',
  heading3: '[size=${size}][b]${text}[/b][/size]',
  paragraph: '${text}',
  strong: '[b]${text}[/b]',
  em: '[i]${text}[/i]',
  del: '[s]${text}[/s]',
  codespan: '[color=#333333][backcolor=#f4f4f4]${text}[/backcolor][/color]',
  code: '[code]${text}\n[/code]',
  blockquote: '[quote]${text}[/quote]',
  hr: '[hr]',
  link: '[url=${href}]${text}[/url]',
  image: '[img]${href}[/img]',
  list: '[${tag}]\n${body}[/list]',
  listitem: '[*]${text}',
  table: '[table]${header}${body}[/table]',
  tablerow: '[tr]${content}[/tr]',
  tablecell: '[td]${content}[/td]',
  removeEmoji: true,
  autoNumbering: false
}

export interface SettingMeta {
  key: keyof ConverterSettings
  label: string
  variables: string
  desc: string
}

export const SETTING_META: SettingMeta[] = [
  { key: 'heading1', label: '标题 1 (h1)', variables: '${text} ${level} ${size}', desc: 'size=3 (4-1)' },
  { key: 'heading2', label: '标题 2 (h2)', variables: '${text} ${level} ${size}', desc: 'size=2 (4-2)' },
  { key: 'heading3', label: '标题 3 (h3+)', variables: '${text} ${level} ${size}', desc: 'h4/h5/h6 同 h3，size=1 (4-3)' },
  { key: 'paragraph', label: '段落', variables: '${text}', desc: '' },
  { key: 'strong', label: '加粗', variables: '${text}', desc: '' },
  { key: 'em', label: '斜体', variables: '${text}', desc: '' },
  { key: 'del', label: '删除线', variables: '${text}', desc: '' },
  { key: 'codespan', label: '行内代码', variables: '${text}', desc: '' },
  { key: 'code', label: '代码块', variables: '${text} ${lang}', desc: '' },
  { key: 'blockquote', label: '引用', variables: '${text}', desc: '' },
  { key: 'hr', label: '水平线', variables: '无变量', desc: '' },
  { key: 'link', label: '链接', variables: '${text} ${href} ${title}', desc: 'href 默认为 text' },
  { key: 'image', label: '图片', variables: '${href}', desc: '' },
  { key: 'list', label: '列表', variables: '${body} ${tag}', desc: 'tag 自动为 list 或 list=1' },
  { key: 'listitem', label: '列表项', variables: '${text}', desc: '' },
  { key: 'table', label: '表格', variables: '${header} ${body}', desc: '' },
  { key: 'tablerow', label: '表格行', variables: '${content}', desc: '' },
  { key: 'tablecell', label: '表格单元格', variables: '${content}', desc: '' }
]

export const EMOJI_REGEX = /[\p{Extended_Pictographic}\u{FE00}-\u{FE0F}\u{200D}]/gu

export function removeEmoji(text: string): string {
  return text.replace(EMOJI_REGEX, '')
}

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\$\{(\w+)\}/g, (_, key: string) => vars[key] || '')
}

export function loadSettings(): ConverterSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_SETTINGS, ...parsed } as ConverterSettings
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
  return { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings: ConverterSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* ignore */
  }
}

export function resetSettings(): ConverterSettings {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_SETTINGS }
}
