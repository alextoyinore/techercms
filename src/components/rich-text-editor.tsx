'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Strikethrough,
  Code,
  ImageIcon,
  Pilcrow,
  Quote,
  Minus,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table as TableIcon,
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { useCallback } from 'react';

const RichTextEditor = ({
  content,
  onChange,
  disabled,
}: {
  content: string;
  onChange: (richText: string) => void;
  disabled?: boolean;
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal pl-4',
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc pl-4',
          },
        },
      }),
      Image,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content,
    editorProps: {
      attributes: {
        class:
          'prose dark:prose-invert prose-sm sm:prose-base min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editable: !disabled,
  });

  const addImage = useCallback(() => {
    const url = window.prompt('URL');

    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1 rounded-md border border-input p-1">
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 1 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          disabled={disabled}
        >
          <Heading1 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 2 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          disabled={disabled}
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 3 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          disabled={disabled}
        >
          <Heading3 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('paragraph')}
          onPressedChange={() => editor.chain().focus().setParagraph().run()}
          disabled={disabled}
        >
          <Pilcrow className="h-4 w-4" />
        </Toggle>
        <Separator orientation="vertical" className="h-6" />
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('strike')}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          disabled={disabled}
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>
        <Separator orientation="vertical" className="h-6" />
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: 'left' })}
          onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
          disabled={disabled}
        >
          <AlignLeft className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: 'center' })}
          onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
          disabled={disabled}
        >
          <AlignCenter className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: 'right' })}
          onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
          disabled={disabled}
        >
          <AlignRight className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: 'justify' })}
          onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()}
          disabled={disabled}
        >
          <AlignJustify className="h-4 w-4" />
        </Toggle>
        <Separator orientation="vertical" className="h-6" />
        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() =>
            editor.chain().focus().toggleBulletList().run()
          }
          disabled={disabled}
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() =>
            editor.chain().focus().toggleOrderedList().run()
          }
          disabled={disabled}
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('blockquote')}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={disabled}
        >
          <Quote className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}
          disabled={disabled}
        >
          <Minus className="h-4 w-4" />
        </Toggle>
        <Separator orientation="vertical" className="h-6" />
        <Toggle
          size="sm"
          onPressedChange={addImage}
          disabled={disabled}
        >
          <ImageIcon className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('codeBlock')}
          onPressedChange={() =>
            editor.chain().focus().toggleCodeBlock().run()
          }
          disabled={disabled}
        >
          <Code className="h-4 w-4" />
        </Toggle>
        <Separator orientation="vertical" className="h-6" />
        <Toggle
          size="sm"
          onPressedChange={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo() || disabled}
        >
          <Undo className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          onPressedChange={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo() || disabled}
        >
          <Redo className="h-4 w-4" />
        </Toggle>
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-md border border-input p-1">
        <Toggle
            size="sm"
            onPressedChange={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            disabled={disabled}
        >
            <TableIcon className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" onPressedChange={() => editor.chain().focus().addColumnBefore().run()} disabled={!editor.can().addColumnBefore() || disabled}><span className="text-xs">Add Col Before</span></Toggle>
        <Toggle size="sm" onPressedChange={() => editor.chain().focus().addColumnAfter().run()} disabled={!editor.can().addColumnAfter() || disabled}><span className="text-xs">Add Col After</span></Toggle>
        <Toggle size="sm" onPressedChange={() => editor.chain().focus().deleteColumn().run()} disabled={!editor.can().deleteColumn() || disabled}><span className="text-xs">Del Col</span></Toggle>
        <Toggle size="sm" onPressedChange={() => editor.chain().focus().addRowBefore().run()} disabled={!editor.can().addRowBefore() || disabled}><span className="text-xs">Add Row Before</span></Toggle>
        <Toggle size="sm" onPressedChange={() => editor.chain().focus().addRowAfter().run()} disabled={!editor.can().addRowAfter() || disabled}><span className="text-xs">Add Row After</span></Toggle>
        <Toggle size="sm" onPressedChange={() => editor.chain().focus().deleteRow().run()} disabled={!editor.can().deleteRow() || disabled}><span className="text-xs">Del Row</span></Toggle>
        <Toggle size="sm" onPressedChange={() => editor.chain().focus().deleteTable().run()} disabled={!editor.can().deleteTable() || disabled}><span className="text-xs">Del Table</span></Toggle>
        <Toggle size="sm" onPressedChange={() => editor.chain().focus().mergeCells().run()} disabled={!editor.can().mergeCells() || disabled}><span className="text-xs">Merge Cells</span></Toggle>
        <Toggle size="sm" onPressedChange={() => editor.chain().focus().splitCell().run()} disabled={!editor.can().splitCell() || disabled}><span className="text-xs">Split Cell</span></Toggle>
        <Toggle size="sm" onPressedChange={() => editor.chain().focus().toggleHeaderColumn().run()} disabled={!editor.can().toggleHeaderColumn() || disabled}><span className="text-xs">Toggle Header Col</span></Toggle>
        <Toggle size="sm" onPressedChange={() => editor.chain().focus().toggleHeaderRow().run()} disabled={!editor.can().toggleHeaderRow() || disabled}><span className="text-xs">Toggle Header Row</span></Toggle>
        <Toggle size="sm" onPressedChange={() => editor.chain().focus().toggleHeaderCell().run()} disabled={!editor.can().toggleHeaderCell() || disabled}><span className="text-xs">Toggle Header Cell</span></Toggle>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
