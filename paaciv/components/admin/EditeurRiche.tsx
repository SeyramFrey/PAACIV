'use client'

import { useState } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export function EditeurRiche({
  name,
  defaultValue = '',
  ariaLabel,
}: {
  name: string
  defaultValue?: string
  ariaLabel?: string
}) {
  const [html, setHtml] = useState(defaultValue)
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // heading limité à H2/H3 ; pas de codeBlock/horizontalRule.
      // StarterKit (Tiptap 3) embarque déjà Link : on le configure ici plutôt
      // que d'importer @tiptap/extension-link séparément (double inscription).
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        horizontalRule: false,
        link: { openOnClick: false },
      }),
    ],
    content: defaultValue,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  })

  const btn = (actif: boolean, onClick: () => void, label: string) => (
    <button
      type="button"
      aria-label={label}
      aria-pressed={actif}
      onClick={onClick}
      className={`rounded border border-encre/20 px-2 py-1 text-sm ${actif ? 'bg-or text-encre' : 'bg-white text-brun'}`}
    >
      {label}
    </button>
  )

  const lien = (ed: Editor) => {
    const url = window.prompt('URL du lien')
    if (url === null) return
    if (url === '') ed.chain().focus().unsetLink().run()
    else ed.chain().focus().setLink({ href: url }).run()
  }

  return (
    <div className="rounded-xl border border-encre/20 bg-white">
      <input type="hidden" name={name} value={html} readOnly />
      {editor && (
        <div className="flex flex-wrap gap-1 border-b border-encre/10 p-2">
          {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'Gras')}
          {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'Italique')}
          {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'Titre 2')}
          {btn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'Titre 3')}
          {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), 'Liste à puces')}
          {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Liste numérotée')}
          {btn(editor.isActive('link'), () => lien(editor), 'Lien')}
          {btn(false, () => editor.chain().focus().clearNodes().unsetAllMarks().run(), 'Effacer le format')}
        </div>
      )}
      <EditorContent
        editor={editor}
        aria-label={ariaLabel}
        className="min-h-[8rem] px-3 py-2 [&_.ProseMirror]:min-h-[6rem] [&_.ProseMirror]:outline-none [&_.ProseMirror_h2]:font-serif [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6"
      />
    </div>
  )
}
