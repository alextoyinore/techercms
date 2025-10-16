'use client';

import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLayoutsView } from './PageLayoutsView';
import { BlockLayoutsView } from './BlockLayoutsView';

export default function LayoutsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Layouts"
        description="Manage your site's page structures and reusable content blocks."
      />
      <Tabs defaultValue="page-layouts">
        <TabsList>
          <TabsTrigger value="page-layouts">Page Layouts</TabsTrigger>
          <TabsTrigger value="block-layouts">Block Layouts</TabsTrigger>
        </TabsList>
        <TabsContent value="page-layouts">
          <PageLayoutsView />
        </TabsContent>
        <TabsContent value="block-layouts">
          <BlockLayoutsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
