'use client';

import { PageHeader } from "@/components/page-header";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Blocks } from "lucide-react";

export default function WidgetsPage() {
    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Widgets"
                description="Manage your site's widgets and widget areas."
            />

            <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Widget Areas</CardTitle>
                            <CardDescription>
                                Drag widgets from the right to the widget areas below to activate them.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                Widget Area Management Coming Soon
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Available Widgets</CardTitle>
                             <CardDescription>
                                These are the widgets you can use.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                Available Widgets List Coming Soon
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}