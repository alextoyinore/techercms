
'use client';

import { useEditor, EditorContent, Node } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Iframe from '@tiptap/extension-iframe';
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
  Link2,
  BarChart,
  Youtube,
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { MediaLibrary } from './media-library';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { ChartWidget } from './widgets/ChartWidget';

// Custom Tiptap Node for Related Post
const RelatedPostNode = Node.create({
  name: 'relatedPost',
  group: 'block',
  atom: true, // This makes it behave like a single, non-editable unit
  
  addAttributes() {
    return {
      'data-id': { default: null },
      'data-slug': { default: null },
      'data-title': { default: 'Related Post' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="related-post"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    // The `0` was causing the "content hole" error in an atom node. Removing it fixes the issue.
    return ['div', { ...HTMLAttributes, 'data-type': 'related-post' }];
  },
  
  // This is what renders it inside the editor
  addNodeView() {
    return ({ node }) => {
      const { 'data-title': title } = node.attrs;
      const dom = document.createElement('div');
      dom.setAttribute('data-type', 'related-post');
      dom.className = 'my-4 p-3 rounded-md border border-dashed flex items-center gap-2 bg-muted/50 cursor-default';
      
      const icon = document.createElement('span');
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link-2"><path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><line x1="8" x2="16" y1="12" y2="12"/></svg>`;
      icon.className = 'text-muted-foreground';
      
      const text = document.createElement('span');
      text.className = 'text-sm font-medium text-muted-foreground';
      text.textContent = `Related Post: ${title}`;

      dom.append(icon, text);
      return { dom };
    };
  },

  // This ensures it's excluded from text-based outputs (like for audio generation)
  addCommands() {
    return {
      setRelatedPost: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { 
            'data-id': options.id,
            'data-slug': options.slug,
            'data-title': options.title,
          },
        });
      },
    };
  },
});

const ChartNode = Node.create({
  name: 'chartWidget',
  group: 'block',
  atom: true,
  
  addAttributes() {
    return {
      'data-chart-id': { default: null },
      'data-chart-name': { default: 'Chart' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="chart-widget"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { ...HTMLAttributes, 'data-type': 'chart-widget' }];
  },
  
  addNodeView() {
    return ({ node }) => {
      const { 'data-chart-name': name } = node.attrs;
      const dom = document.createElement('div');
      dom.setAttribute('data-type', 'chart-widget');
      dom.className = 'my-4 p-3 rounded-md border border-dashed flex items-center gap-2 bg-muted/50 cursor-default';
      
      const icon = document.createElement('span');
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bar-chart"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>`;
      icon.className = 'text-muted-foreground';
      
      const text = document.createElement('span');
      text.className = 'text-sm font-medium text-muted-foreground';
      text.textContent = `Chart: ${name}`;

      dom.append(icon, text);
      return { dom };
    };
  },

  addCommands() {
    return {
      setChartWidget: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { 
            'data-chart-id': options.id,
            'data-chart-name': options.name,
          },
        });
      },
    };
  },
});


type Post = {
  id: string;
  title: string;
  slug: string;
};

type ChartData = {
    id: string;
    name: string;
};

const PostPicker = ({ onSelectPost }: { onSelectPost: (post: Post) => void }) => {
    const firestore = useFirestore();
    const [searchTerm, setSearchTerm] = useState('');

    const postsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'posts'), where('status', '==', 'published'));
    }, [firestore]);

    const { data: posts, isLoading } = useCollection<Post>(postsQuery);

    const filteredPosts = useMemo(() => {
        if (!posts) return [];
        if (!searchTerm) return posts;
        return posts.filter(post => post.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [posts, searchTerm]);

    return (
        <div className="flex flex-col gap-4">
            <Input 
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ScrollArea className="h-64 border rounded-md">
                <div className="p-2">
                    {isLoading && <p className="text-sm text-muted-foreground p-2">Loading posts...</p>}
                    {!isLoading && filteredPosts.map(post => (
                        <div 
                            key={post.id}
                            className="p-2 rounded-md hover:bg-accent cursor-pointer"
                            onClick={() => onSelectPost(post)}
                        >
                            <p className="font-medium text-sm">{post.title}</p>
                        </div>
                    ))}
                    {!isLoading && filteredPosts.length === 0 && (
                         <p className="text-sm text-muted-foreground p-2 text-center">No posts found.</p>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}

const ChartPicker = ({ onSelectChart }: { onSelectChart: (chart: ChartData) => void }) => {
    const firestore = useFirestore();
    const [searchTerm, setSearchTerm] = useState('');

    const chartsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'charts'));
    }, [firestore]);

    const { data: charts, isLoading } = useCollection<ChartData>(chartsQuery);

    const filteredCharts = useMemo(() => {
        if (!charts) return [];
        if (!searchTerm) return charts;
        return charts.filter(chart => chart.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [charts, searchTerm]);

    return (
        <div className="flex flex-col gap-4">
            <Input 
                placeholder="Search charts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ScrollArea className="h-64 border rounded-md">
                <div className="p-2">
                    {isLoading && <p className="text-sm text-muted-foreground p-2">Loading charts...</p>}
                    {!isLoading && filteredCharts.map(chart => (
                        <div 
                            key={chart.id}
                            className="p-2 rounded-md hover:bg-accent cursor-pointer"
                            onClick={() => onSelectChart(chart)}
                        >
                            <p className="font-medium text-sm">{chart.name}</p>
                        </div>
                    ))}
                    {!isLoading && filteredCharts.length === 0 && (
                         <p className="text-sm text-muted-foreground p-2 text-center">No charts found.</p>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}


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
        // Other options
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
      Iframe,
      RelatedPostNode,
      ChartNode,
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
  const [isPostPickerOpen, setIsPostPickerOpen] = useState(false);
  const [isChartPickerOpen, setIsChartPickerOpen] = useState(false);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const addImageFromUrl = useCallback((url: string) => {
    if (url && editor) {
        editor.chain().focus().insertContent(`<figure><img src="${url}"><figcaption></figcaption></figure>`).run();
        setIsMediaLibraryOpen(false);
    }
  }, [editor]);

  const addIframe = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Enter Iframe URL');
    if (url) {
      editor.chain().focus().setIframe({ src: url }).run();
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
  
  const addRelatedPost = useCallback((post: Post) => {
    if (editor && post) {
        editor.chain().focus().setRelatedPost({ id: post.id, slug: post.slug, title: post.title }).run();
        setIsPostPickerOpen(false);
    }
  }, [editor]);
  
  const addChart = useCallback((chart: ChartData) => {
    if (editor && chart) {
        editor.chain().focus().setChartWidget({ id: chart.id, name: chart.name }).run();
        setIsChartPickerOpen(false);
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
        <Dialog open={isPostPickerOpen} onOpenChange={setIsPostPickerOpen}>
            <DialogTrigger asChild>
                <Toggle size="sm" disabled={disabled} aria-label="Insert Related Post">
                    <Link2 className="h-4 w-4" />
                </Toggle>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Insert Related Post</DialogTitle>
                </DialogHeader>
                <PostPicker onSelectPost={addRelatedPost} />
            </DialogContent>
        </Dialog>
         <Dialog open={isChartPickerOpen} onOpenChange={setIsChartPickerOpen}>
            <DialogTrigger asChild>
                <Toggle size="sm" disabled={disabled} aria-label="Insert Chart">
                    <BarChart className="h-4 w-4" />
                </Toggle>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Insert Chart</DialogTitle>
                </DialogHeader>
                <ChartPicker onSelectChart={addChart} />
            </DialogContent>
        </Dialog>
        <MediaLibrary onSelect={addImageFromUrl}>
            <Toggle size="sm" disabled={disabled}>
                <ImageIcon className="h-4 w-4" />
            </Toggle>
        </MediaLibrary>
        <Toggle size="sm" onClick={addIframe} disabled={disabled}>
          <Youtube className="h-4 w-4" />
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
