declare module 'marked' {
  export class Renderer {
    paragraph: (text: string) => string
    heading: (text: string, level: number) => string
    strong: (text: string) => string
    em: (text: string) => string
    del: (text: string) => string
    codespan: (text: string) => string
    code: (text: string, lang: string) => string
    br: () => string
    blockquote: (text: string) => string
    hr: () => string
    link: (href: string, title: string | null, text: string) => string
    image: (href: string, title: string | null, text: string) => string
    list: (body: string, ordered: boolean) => string
    listitem: (text: string) => string
    table: (header: string, body: string) => string
    tablerow: (content: string) => string
    tablecell: (content: string, flags: { header: boolean; align: 'center' | 'left' | 'right' | null } | null) => string
  }

  export interface MarkedOptions {
    renderer?: Renderer
    gfm?: boolean
    breaks?: boolean
  }

  export function setOptions(options: MarkedOptions): void

  interface Marked {
    (text: string): string
    Renderer: typeof Renderer
    setOptions: typeof setOptions
  }

  export const marked: Marked
}
