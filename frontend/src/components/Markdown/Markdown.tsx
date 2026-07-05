import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownProps {
  children: string
  className?: string
}

/**
 * Shared markdown renderer (GitHub-flavoured) styled to match the app's
 * gray/blue Tailwind palette. Used for issue descriptions and comment bodies.
 */
export const Markdown = ({ children, className = '' }: MarkdownProps) => {
  return (
    <div className={`text-sm text-gray-700 ${className}`} data-testid="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-gray-900 mt-4 mb-2 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-gray-900 mt-4 mb-2 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-gray-900 mt-3 mb-1.5 first:mt-0">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-gray-900 mt-3 mb-1 first:mt-0">{children}</h4>
          ),
          p: ({ children }) => <p className="my-2 text-sm text-gray-700">{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="my-2 pl-5 list-disc space-y-1 text-sm text-gray-700">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 pl-5 list-decimal space-y-1 text-sm text-gray-700">{children}</ol>
          ),
          li: ({ children }) => <li className="text-sm text-gray-700">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-2 pl-3 border-l-4 border-gray-200 text-gray-600 italic">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-gray-100 rounded px-1 py-0.5 font-mono text-[13px] text-gray-800">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="my-2 bg-gray-100 rounded p-3 overflow-x-auto text-[13px] leading-relaxed">
              {children}
            </pre>
          ),
          hr: () => <hr className="my-4 border-gray-200" />,
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto">
              <table className="min-w-max border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-200 bg-gray-50 px-3 py-1.5 text-left font-semibold text-gray-900">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-200 px-3 py-1.5 text-gray-700">{children}</td>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">{children}</strong>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
