'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Zap, BarChart, Shield } from "lucide-react";
import * as LucideIcons from 'lucide-react';

type FeatureGridPreviewProps = {
    config: {
        features?: {
            id: string;
            icon: string;
            title: string;
            description: string;
        }[];
    }
}

export function FeatureGridPreview({ config }: FeatureGridPreviewProps) {
    const { features = [] } = config;
    
    const renderIcon = (iconName: string) => {
        const Icon = (LucideIcons as any)[iconName];
        return Icon ? <Icon className="h-8 w-8 text-primary" /> : <Zap className="h-8 w-8 text-primary" />;
    };

    return (
        <div className="grid md:grid-cols-3 gap-6 rounded-lg border p-6">
            {features.map((feature) => (
                <div key={feature.id} className="text-center space-y-2">
                    <div className="flex justify-center">{renderIcon(feature.icon)}</div>
                    <h4 className="font-bold">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
            ))}
        </div>
    )
}

    