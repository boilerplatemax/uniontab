'use client'

interface RichTextContentProps {
  content: string
  className?: string
}

export function RichTextContent({ content, className = '' }: RichTextContentProps) {
  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
