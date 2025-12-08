'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Heading2,
} from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './dialog'
import { useCallback, useState, useEffect } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Write something...',
  className = '',
}: RichTextEditorProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:underline cursor-pointer',
        },
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px] px-4 py-3',
      },
    },
  })

  // Update editor content when prop changes (e.g., from URL parameters)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false)
    }
  }, [editor, content])

  const openLinkDialog = useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href
    const { from, to } = editor.state.selection
    const text = editor.state.doc.textBetween(from, to, '')

    setLinkUrl(previousUrl || '')
    setLinkText(text)
    setLinkDialogOpen(true)
  }, [editor])

  const handleSetLink = useCallback(() => {
    if (!editor) return

    // empty
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      setLinkDialogOpen(false)
      return
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
    setLinkDialogOpen(false)
    setLinkUrl('')
    setLinkText('')
  }, [editor, linkUrl])

  if (!editor) {
    return null
  }

  return (
    <>
      <div className={`border rounded-lg overflow-hidden ${className}`}>
        {/* Toolbar */}
        <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-gray-200' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-gray-200' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-gray-200' : ''}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={openLinkDialog}
          className={editor.isActive('link') ? 'bg-gray-200' : ''}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

        {/* Editor Content */}
        <EditorContent editor={editor} />
      </div>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {linkText && (
              <div>
                <Label htmlFor="link-text">Selected Text</Label>
                <Input
                  id="link-text"
                  value={linkText}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            )}
            <div>
              <Label htmlFor="link-url">URL *</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSetLink()
                  }
                }}
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave empty to remove the link
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setLinkDialogOpen(false)
                setLinkUrl('')
                setLinkText('')
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSetLink}>
              {linkUrl ? 'Set Link' : 'Remove Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
