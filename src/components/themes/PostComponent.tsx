
'use client';

import { memo, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { ThemeLayout } from './ThemeLayout';
import { PublicHeader as BusinessHeader, PublicFooter as BusinessFooter } from './business/HomePage';
import { CreativeHeader, CreativeFooter } from './creative-portfolio/HomePage';
import { MagazineProHeader, MagazineProFooter } from './magazine-pro/HomePage';
import { MinimalistHeader, MinimalistFooter } from './minimalist-blog/HomePage';
import { NewspaperHeader, NewspaperFooter } from './newspaper/HomePage';
import { PublicHeader as NewsProHeader, PublicFooter as NewsProFooter } from './newspro/HomePage';
import { PublicHeader as SportsHeader, PublicFooter as SportsFooter } from './sports/HomePage';
import { PublicHeader as TechTodayHeader, PublicFooter as TechTodayFooter } from './tech-today/HomePage';
import { PublicHeader as VogueHeader, PublicFooter as VogueFooter } from './vogue/HomePage';
import SlugPage from './business/SlugPage'; // Using one SlugPage as the template for rendering content
import type { Timestamp } from 'firebase/firestore';

export type Post = {
  id: string;
  title: string;
  content: string;
  slug: string;
  authorId: string;
  featuredImageUrl: string;
  createdAt: Timestamp;
  tagIds?: string[];
  metaDescription?: string;
  excerpt?: string;
  categoryIds?: string[];
};

const themeMap = {
    'Business': { Header: BusinessHeader, Footer: BusinessFooter },
    'Creative Portfolio': { Header: CreativeHeader, Footer: CreativeFooter },
    'Magazine Pro': { Header: MagazineProHeader, Footer: MagazineProFooter },
    'Minimalist Blog': { Header: MinimalistHeader, Footer: MinimalistFooter },
    'Newspaper': { Header: NewspaperHeader, Footer: NewspaperFooter },
    'NewsPro': { Header: NewsProHeader, Footer: NewsProFooter },
    'Sports': { Header: SportsHeader, Footer: SportsFooter },
    'Tech Today': { Header: TechTodayHeader, Footer: TechTodayFooter },
    'Vogue': { Header: VogueHeader, Footer: VogueFooter }
};

interface PostComponentProps {
  post: Post;
  isLast: boolean;
  onLastPostInView: () => void;
  themeName?: keyof typeof themeMap;
}

const PostComponent: React.FC<PostComponentProps> = memo(({ post, isLast, onLastPostInView, themeName = 'Business' }) => {
  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  useEffect(() => {
    if (inView && isLast) {
      onLastPostInView();
    }
  }, [inView, isLast, onLastPostInView]);

  const { Header, Footer } = themeMap[themeName] || themeMap['Business'];

  return (
    <div ref={ref} id={post.slug}>
      <ThemeLayout HeaderComponent={Header} FooterComponent={Footer}>
        <SlugPage preloadedItem={post} />
      </ThemeLayout>
    </div>
  );
});

PostComponent.displayName = 'PostComponent';

export default PostComponent;
