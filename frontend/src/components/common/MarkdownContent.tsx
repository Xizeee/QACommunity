import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// react-markdown 默认不渲染原始 HTML，Markdown 中的脚本/HTML 会被转义，
// 满足 TECH_DESIGN 的 Markdown 安全渲染要求
export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
