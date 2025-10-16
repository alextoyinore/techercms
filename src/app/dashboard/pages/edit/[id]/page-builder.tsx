'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

type PageBuilderProps = {
    pageId: string;
}

export default function PageBuilder({ pageId }: PageBuilderProps) {

    return (
        <div>
            <h2 className="text-2xl font-bold">Page Builder</h2>
            <p>Coming soon... (Page ID: {pageId})</p>
        </div>
    )
}
