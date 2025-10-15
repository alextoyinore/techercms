'use client';

import { PageHeader } from "@/components/page-header";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { GripVertical } from "lucide-react";

// Mock data for now, we will fetch this from Firestore later
const availableWidgets = [
    { type: 'recent-posts', name: 'Recent Posts', description: 'Display a list of your most recent posts.' },
    { type: 'categories-list', name: 'Categories', description: 'Show a list of all post categories.' },
    { type: 'tag-cloud', name: 'Tag Cloud', description: 'A cloud of your most used tags.' },
    { type: 'search', name: 'Search', description: 'Display a search form.' },
    { type: 'custom-html', name: 'Custom HTML', description: 'Enter arbitrary HTML.' },
];

const widgetAreas = [
    { id: 'sidebar-primary', name: 'Main Sidebar', description: 'Appears on the side of posts and pages.' },
    { id: 'footer-1', name: 'Footer Section 1', description: 'First section in the site footer.' },
];

function WidgetPlaceholder() {
    return (
        <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            Drag widgets here
        </div>
    )
}

export default function WidgetsPage() {
    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Widgets"
                description="Manage your site's widgets and widget areas."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Widget Areas</CardTitle>
                            <CardDescription>
                                Drag widgets from the right to a widget area below to activate them.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Accordion type="multiple" defaultValue={['sidebar-primary']} className="space-y-4">
                                {widgetAreas.map((area) => (
                                    <Card key={area.id}>
                                        <AccordionItem value={area.id} className="border-b-0">
                                            <AccordionTrigger className="p-4 hover:no-underline">
                                                <div className="flex-1 text-left">
                                                    <h3 className="font-semibold">{area.name}</h3>
                                                    <p className="text-sm text-muted-foreground">{area.description}</p>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="p-4 pt-0">
                                               <WidgetPlaceholder />
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Card>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card className="sticky top-20">
                        <CardHeader>
                            <CardTitle className="font-headline">Available Widgets</CardTitle>
                             <CardDescription>
                                Drag these to a widget area on the left.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            {availableWidgets.map((widget) => (
                                <div key={widget.type} className="flex items-start gap-2 rounded-md border p-3 bg-muted/50 cursor-grab active:cursor-grabbing">
                                    <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div className="grid gap-0.5">
                                        <p className="font-medium">{widget.name}</p>
                                        <p className="text-xs text-muted-foreground">{widget.description}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
