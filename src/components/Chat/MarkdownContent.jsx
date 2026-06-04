import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--text-primary)]">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-[var(--text-secondary)]">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1.5 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1.5 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => (
    <h1 className="font-heading mb-2 text-lg font-bold text-[var(--text-primary)]">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-heading mb-2 text-base font-bold text-[var(--text-primary)]">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1.5 text-sm font-semibold text-[var(--text-primary)]">{children}</h3>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-[var(--accent)] underline underline-offset-2 hover:text-[var(--accent-light)]"
    >
      {children}
    </a>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes('language-')
    if (isBlock) {
      return (
        <pre className="my-2 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] p-3">
          <code className="font-mono text-xs text-[var(--text-primary)]">{children}</code>
        </pre>
      )
    }
    return (
      <code className="rounded border border-[var(--border)] bg-[var(--bg-dark)]/80 px-1 py-0.5 font-mono text-[0.85em] text-[var(--accent-light)]">
        {children}
      </code>
    )
  },
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-[var(--accent)]/50 pl-3 text-[var(--text-secondary)]">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-[var(--border)]" />,
}

/**
 * Renders assistant/user text with Markdown (bold, lists, links, etc.).
 */
export default function MarkdownContent({ children, className = '' }) {
  const text = children == null ? '' : String(children)
  if (!text.trim()) return null

  return (
    <div className={`markdown-content ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  )
}
