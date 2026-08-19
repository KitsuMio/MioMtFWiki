type MarkdownItLike = {
  core: {
    ruler: {
      after: (afterName: string, ruleName: string, rule: (state: any) => void) => void
    }
  }
}

type InlineKind = 'strong' | 'em' | 'strong-em' | 's'

interface Delimiter {
  marker: string
  kind: InlineKind
}

const delimiters: Delimiter[] = [
  { marker: '***', kind: 'strong-em' },
  { marker: '___', kind: 'strong-em' },
  { marker: '**', kind: 'strong' },
  { marker: '__', kind: 'strong' },
  { marker: '~~', kind: 's' },
  { marker: '*', kind: 'em' },
  { marker: '_', kind: 'em' }
]

// Markdown-It 的 CommonMark 边界规则以西文排版为中心。强调标记紧贴
// 中文正文、且内容从中文引号等标点开始时，合法的 **…** 可能残留为纯文本。
// 这里只接管默认行内解析器遗漏的、确实含有中日韩文字的文本 token；代码、
// HTML、链接目标以及已经成功解析的强调 token 均不会经过这里。
const containsCjk = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u

function pushText(output: any[], Token: any, content: string) {
  if (!content) return
  const token = new Token('text', '', 0)
  token.content = content
  output.push(token)
}

function pushWrapped(output: any[], Token: any, content: string, delimiter: Delimiter) {
  const pairs = delimiter.kind === 'strong-em'
    ? [
        ['em_open', 'em', 1],
        ['strong_open', 'strong', 1]
      ]
    : delimiter.kind === 'strong'
      ? [['strong_open', 'strong', 1]]
      : delimiter.kind === 'em'
        ? [['em_open', 'em', 1]]
        : [['s_open', 's', 1]]

  for (const [type, tag, nesting] of pairs) {
    const token = new Token(type, tag, nesting)
    token.markup = delimiter.marker
    output.push(token)
  }

  pushText(output, Token, content)

  for (const [type, tag] of [...pairs].reverse()) {
    const token = new Token(type.replace('_open', '_close'), tag, -1)
    token.markup = delimiter.marker
    output.push(token)
  }
}

function findNext(content: string, from: number) {
  let result: { start: number; end: number; inner: string; delimiter: Delimiter } | undefined

  for (const delimiter of delimiters) {
    let start = content.indexOf(delimiter.marker, from)

    while (start !== -1) {
      // 单字符标记不能从一个更长的标记串中间开始。
      const before = content[start - 1]
      const afterMarker = content[start + delimiter.marker.length]
      if (delimiter.marker.length === 1 && (before === delimiter.marker || afterMarker === delimiter.marker)) {
        start = content.indexOf(delimiter.marker, start + 1)
        continue
      }

      const end = content.indexOf(delimiter.marker, start + delimiter.marker.length)
      if (end === -1) break

      const inner = content.slice(start + delimiter.marker.length, end)
      const valid = inner.length > 0
        && !/^\s|\s$/u.test(inner)
        && containsCjk.test(inner)

      if (valid && (!result || start < result.start || (
        start === result.start && delimiter.marker.length > result.delimiter.marker.length
      ))) {
        result = { start, end, inner, delimiter }
      }
      break
    }
  }

  return result
}

function repairTextToken(token: any, Token: any) {
  const content = token.content as string
  if (!content || !containsCjk.test(content)) return [token]

  const output: any[] = []
  let cursor = 0
  let changed = false

  while (cursor < content.length) {
    const match = findNext(content, cursor)
    if (!match) break

    pushText(output, Token, content.slice(cursor, match.start))
    pushWrapped(output, Token, match.inner, match.delimiter)
    cursor = match.end + match.delimiter.marker.length
    changed = true
  }

  if (!changed) return [token]
  pushText(output, Token, content.slice(cursor))
  return output
}

export function cjkInlineTypography(md: MarkdownItLike) {
  md.core.ruler.after('inline', 'cjk_inline_typography', (state: any) => {
    for (const blockToken of state.tokens) {
      if (blockToken.type !== 'inline' || !blockToken.children) continue

      blockToken.children = blockToken.children.flatMap((token: any) => (
        token.type === 'text' ? repairTextToken(token, state.Token) : [token]
      ))
    }
  })
}
