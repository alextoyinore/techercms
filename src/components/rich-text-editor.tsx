'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
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
  Columns2,
  Rows2,
  Trash2,
  Combine,
  Split,
  FlipHorizontal,
  FlipVertical,
  RectangleHorizontal,
  Link as LinkIcon,
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { useCallback, useEffect, useState } from 'react';
import { MediaLibrary } from './media-library';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

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
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class:
          'prose dark:prose-invert prose-sm min-h-[300px] w-full max-w-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editable: !disabled,
  });

  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const addImageFromUrl = useCallback((url: string) => {
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
      setIsMediaLibraryOpen(false); // Close the dialog on select
    }
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
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
        <input
            type="color"
            className='w-6 h-6 p-0.5 bg-transparent border rounded-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'
            onInput={(event: React.ChangeEvent<HTMLInputElement>) => editor.chain().focus().setColor(event.target.value).run()}
            value={editor.getAttributes('textStyle').color}
            disabled={disabled}
        />
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
            onPressedChange={setLink}
            pressed={editor.isActive('link')}
            disabled={disabled}
        >
            <LinkIcon className="h-4 w-4" />
        </Toggle>
        <Dialog open={isMediaLibraryOpen} onOpenChange={setIsMediaLibraryOpen}>
          <DialogTrigger asChild>
             <Toggle
              size="sm"
              disabled={disabled}
            >
              <ImageIcon className="h-4 w-4" />
            </Toggle>
          </DialogTrigger>
          <DialogContent className="max-w-4xl h-5/6 flex flex-col">
            <DialogHeader>
              <DialogTitle>Select an Image</DialogTitle>
            </DialogHeader>
            <div className='flex-1 overflow-y-auto'>
              <MediaLibrary onSelect={addImageFromUrl} />
            </div>
          </DialogContent>
        </Dialog>
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
        <Toggle title="Add Column Before" size="sm" onPressedChange={() => editor.chain().focus().addColumnBefore().run()} disabled={!editor.can().addColumnBefore() || disabled}><Columns2 className="h-4 w-4 rotate-180" /></Toggle>
        <Toggle title="Add Column After" size="sm" onPressedChange={() => editor.chain().focus().addColumnAfter().run()} disabled={!editor.can().addColumnAfter() || disabled}><Columns2 className="h-4 w-4" /></Toggle>
        <Toggle title="Delete Column" size="sm" onPressedChange={() => editor.chain().focus().deleteColumn().run()} disabled={!editor.can().deleteColumn() || disabled}><Trash2 className="h-4 w-4" /></Toggle>
        <Toggle title="Add Row Before" size="sm" onPressedChange={() => editor.chain().focus().addRowBefore().run()} disabled={!editor.can().addRowBefore() || disabled}><Rows2 className="h-4 w-4 rotate-180" /></Toggle>
        <Toggle title="Add Row After" size="sm" onPressedChange={() => editor.chain().focus().addRowAfter().run()} disabled={!editor.can().addRowAfter() || disabled}><Rows2 className="h-4 w-4" /></Toggle>
        <Toggle title="Delete Row" size="sm" onPressedChange={() => editor.chain().focus().deleteRow().run()} disabled={!editor.can().deleteRow() || disabled}><Trash2 className="h-4 w-4" /></Toggle>
        <Toggle title="Delete Table" size="sm" onPressedChange={() => editor.chain().focus().deleteTable().run()} disabled={!editor.can().deleteTable() || disabled}><Trash2 className="h-4 w-4 text-destructive" /></Toggle>
        <Toggle title="Merge Cells" size="sm" onPressedChange={() => editor.chain().focus().mergeCells().run()} disabled={!editor.can().mergeCells() || disabled}><Combine className="h-4 w-4" /></Toggle>
        <Toggle title="Split Cell" size="sm" onPressedChange={() => editor.chain().focus().splitCell().run()} disabled={!editor.can().splitCell() || disabled}><Split className="h-4 w-4" /></Toggle>
        <Toggle title="Toggle Header Column" size="sm" onPressedChange={() => editor.chain().focus().toggleHeaderColumn().run()} disabled={!editor.can().toggleHeaderColumn() || disabled}><FlipHorizontal className="h-4 w-4" /></Toggle>
        <Toggle title="Toggle Header Row" size="sm" onPressedChange={() => editor.chain().focus().toggleHeaderRow().run()} disabled={!editor.can().toggleHeaderRow() || disabled}><FlipVertical className="h-4 w-4" /></Toggle>
        <Toggle title="Toggle Header Cell" size="sm" onPressedChange={() => editor.chain().focus().toggleHeaderCell().run()} disabled={!editor.can().toggleHeaderCell() || disabled}><RectangleHorizontal className="h-4 w-4" /></Toggle>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
