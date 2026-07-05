type SmileyItem = [number, string, string]

interface SmileyData {
  smilies_array: Record<string, SmileyItem[][]>
  smilies_type: Record<string, unknown[]>
}

export class BbcodeToHtmlConverter {
  private smiliesArray: Record<string, SmileyItem[][]> = {}
  private smiliesType: Record<string, unknown[]> = {}
  private readonly mtCdn = 'https://cdn-bbs.mt2.cn'

  constructor() {
    this.initSmilies()
  }

  private async initSmilies(): Promise<void> {
    if (typeof window !== 'undefined' && (window as unknown as { smilies_array?: unknown }).smilies_array) {
      const win = window as unknown as SmileyData
      this.smiliesArray = win.smilies_array || {}
      this.smiliesType = win.smilies_type || {}
      return
    }

    try {
      const response = await fetch(`${this.mtCdn}/data/cache/common_smilies_var.js?LOt`)
      const scriptText = await response.text()
      const match = scriptText.match(/window\.smilies_array\s*=\s*(\[.+\]);/)
      if (match) {
        try {
          this.smiliesArray = JSON.parse(match[1]) as Record<string, SmileyItem[][]>
        } catch {
          this.smiliesArray = {}
        }
      }
    } catch {
      this.smiliesArray = {}
      this.smiliesType = {}
    }
  }

  private getSmileyUrl(smileyKey: string): string | null {
    const base = `${this.mtCdn}/static/image/smiley/`

    for (const t in this.smiliesArray) {
      const pages = this.smiliesArray[t]
      for (const p in pages) {
        for (const s of pages[p]) {
          if (s[1] === smileyKey) {
            const folder = this.smiliesType[`_${t}`]?.[1] as string
            return folder ? base + folder + '/' + s[2] : null
          }
        }
      }
    }
    return null
  }

  private escapeHtml(s: string): string {
    if (typeof s !== 'string') return s
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
    return s.replace(/[&<>"']/g, m => map[m])
  }

  convert(bbcode: string): string {
    if (!bbcode || typeof bbcode !== 'string') {
      return ''
    }

    let html = this.escapeHtml(bbcode)
    const codes: string[] = []
    let idx = 0

    html = html.replace(/\[code]([\s\S]*?)\[\/code]/g, (_m, c) => {
      const lines = c.split('\n').map((l: string) => `<li>${l || '&nbsp;'}<br></li>`).join('')
      codes.push(`<div class="comiis_blockcode comiis_bodybg b_ok f_b"><div class="bg_f b_l"><ol>${lines}</ol></div></div>`)
      return `__CODE__${idx++}__`
    })

    html = this.convertBasicTags(html)
    html = this.convertStructuralTags(html)
    html = this.convertLinksAndMedia(html)
    html = this.convertImagesAndAttachments(html)
    html = this.convertTables(html)
    html = this.convertEmoticons(html)

    html = html.replace(/\n/g, '<br>')

    codes.forEach((c, i) => {
      html = html.replace(`__CODE__${i}__`, c)
    })

    return html
  }

  private convertBasicTags(html: string): string {
    const conversions: { pattern: RegExp; replacement: string }[] = [
      { pattern: /\[size=([^\]]+)]/gi, replacement: '<font size="$1">' },
      { pattern: /\[\/size]/gi, replacement: '</font>' },
      { pattern: /\[color=([^\]]+)]/gi, replacement: '<font color="$1">' },
      { pattern: /\[\/color]/gi, replacement: '</font>' },
      { pattern: /\[backcolor=([^\]]+)]/gi, replacement: '<font style="background-color:$1">' },
      { pattern: /\[\/backcolor]/gi, replacement: '</font>' },
      { pattern: /\[background=([^\]]+)]/gi, replacement: '<font style="background-color:$1">' },
      { pattern: /\[\/background]/gi, replacement: '</font>' },
      { pattern: /\[align=([^\]]+)]/gi, replacement: '<div align="$1">' },
      { pattern: /\[\/align]/gi, replacement: '</div>' },
      { pattern: /\[b]/gi, replacement: '<strong>' },
      { pattern: /\[\/b]/gi, replacement: '</strong>' },
      { pattern: /\[i]/gi, replacement: '<i>' },
      { pattern: /\[\/i]/gi, replacement: '</i>' },
      { pattern: /\[font=([^\]]+)]/gi, replacement: '<font face="$1">' },
      { pattern: /\[\/font]/gi, replacement: '</font>' },
      { pattern: /\[u]/gi, replacement: '<u>' },
      { pattern: /\[\/u]/gi, replacement: '</u>' },
      { pattern: /\[s]/gi, replacement: '<strike>' },
      { pattern: /\[\/s]/gi, replacement: '</strike>' },
      { pattern: /\[hr\]/g, replacement: '<hr class="l">' }
    ]

    for (const { pattern, replacement } of conversions) {
      html = html.replace(pattern, replacement)
    }

    return html
  }

  private convertStructuralTags(html: string): string {
    html = html.replace(/\[quote]([\s\S]*?)\[\/quote]/g,
      '<div class="comiis_quote bg_h b_dashed f_c"><blockquote><font>回复</font> $1</blockquote></div>')

    html = html.replace(/\[free]([\s\S]*?)\[\/free]/g,
      '<div class="comiis_quote bg_h f_c"><blockquote>$1</blockquote></div>')

    html = html.replace(/\[hide(?:=[^\]]*)?]([\s\S]*?)\[\/hide]/g,
      '<div class="comiis_quote bg_h f_c"><h2 class="f_a">本帖隐藏的内容: </h2>$1</div>')

    html = html.replace(/\[list=1]/gi, '<ul class="litype_1" type="1">')
    html = html.replace(/\[list=a]/gi, '<ul class="litype_2" type="a">')
    html = html.replace(/\[list]/gi, '<ul>')
    html = html.replace(/\[\/list]/gi, '</ul>')
    html = html.replace(/\[\*]/gi, '<li>')

    return html
  }

  private convertLinksAndMedia(html: string): string {
    html = html.replace(/\[email=([^\]]+)]([\s\S]*?)\[\/email]/gi,
      '<a href="mailto:$1" target="_blank">$2</a>')
    html = html.replace(/\[email]([\s\S]*?)\[\/email]/gi,
      '<a href="mailto:$1" target="_blank">$1</a>')

    html = html.replace(/\[qq](\d+)\[\/qq]/gi,
      `<a href="http://wpa.qq.com/msgrd?v=3&uin=$1&site=[Discuz!]&from=discuz&menu=yes" target="_blank"><img src="${this.mtCdn}/static/image/common/qq_big.gif" border="0"></a>`)

    const urlMatches = html.match(/\[url(=[\s\S]*?)?]([\s\S]*?)\[\/url]/gi)
    if (urlMatches) {
      urlMatches.forEach(item => {
        const m = item.match(/\[url(?:=([^\]]*))?]([\s\S]*?)\[\/url]/i)
        if (m) {
          const url = m[1] || m[2]
          const text = m[2]
          html = html.replace(item, `<a href="${url}" target="_blank">${text}</a>`)
        }
      })
    }

    html = html.replace(/\[media(=[^\]]+)?\]([\s\S]+?)\[\/media\]/gi, (_, _params, url) => {
      const cleanUrl = url.trim().replace(/[<>"']/g, '')
      let vid = ''

      if (/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/i.test(cleanUrl)) {
        vid = RegExp.$1
      } else if (/bilibili\.com\/video\/av(\d+)/i.test(cleanUrl)) {
        vid = 'BV' + RegExp.$1
      } else if (/b23\.tv\/(BV[a-zA-Z0-9]+)/i.test(cleanUrl)) {
        vid = RegExp.$1
      }

      if (vid) {
        return `<iframe src="https://player.bilibili.com/player.html?bvid=${vid}&high_quality=1" width="100%" height="400" frameborder="0" allowfullscreen></iframe>`
      }

      return `<a href="${cleanUrl}" target="_blank" style="color:#0066cc">${cleanUrl}</a>`
    })

    return html
  }

  private convertImagesAndAttachments(html: string): string {
    html = html.replace(/\[attach]([\s\S]+?)\[\/attach]/g, (_match, aid) =>
      `<div class="comiis_attach bg_e b_ok cl"><a href="javascript:;"><p class="attach_tit"><img src="${this.mtCdn}/static/image/filetype/text.gif" border="0" class="vm" alt=""> <span class="f_ok">附件_${aid}</span><em class="f_d">&nbsp;2026-1-2 21:07上传</em></p><p class="attach_size f_c">未知大小 , 下载次数: 0, 下载积分: 金币 -1 </p></a><div class="attach_txt bg_f b_ok"><span class="f_c">ID：${aid}</span></div></div>`)

    const attMatches = html.match(/\[attachimg]([\s\S]+?)\[\/attachimg]/g) || []
    for (const item of attMatches) {
      const id = item.match(/\[attachimg]([\s\S]+?)\[\/attachimg]/)?.[1] || ''
      const el = document.getElementById(`aimg_${id}`) as HTMLImageElement | null
      html = html.replace(item, `<span class="comiis_postimg vm"><img src="${el?.src || ''}" title="${el?.title || ''}"></span>`)
    }

    const imgMatches = html.match(/\[img(|\=[\s\S]+?)]([\s\S]*?)\[\/img]/g) || []
    for (const item of imgMatches) {
      const sizeMatch = item.match(/\[img=([\s\S]+?)]/)
      const width = sizeMatch ? sizeMatch[1].split(',')[0] : '100%'
      const src = item.match(/\[img(?:=.*?)?]([\s\S]*?)\[\/img]/)?.[1] || ''
      html = html.replace(item, `<img src="${src}" width="${width}">`)
    }

    return html
  }

  private convertTables(html: string): string {
    html = html.replace(/\[td]([\s\S]*?)\[\/td]/g, '<td style="border:1px solid #E3EDF5">$1</td>')
    html = html.replace(/\[tr]([\s\S]*?)\[\/tr]/g, '<tr>$1</tr>')
    html = html.replace(/\[table]([\s\S]*?)\[\/table]/g, '<table style="width:100%">$1</table>')
    return html
  }

  private convertEmoticons(html: string): string {
    const smMatches = html.match(/\[([\#\w\u4e00-\u9fa5]+)]/g) || []
    for (const item of smMatches) {
      const url = this.getSmileyUrl(item)
      if (url) {
        html = html.replace(item, `<img src="${url}" style="max-height:22px">`)
      }
    }
    return html
  }
}

export const bbcodeToHtmlConverter = new BbcodeToHtmlConverter()
