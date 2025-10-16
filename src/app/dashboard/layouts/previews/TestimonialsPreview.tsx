'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type TestimonialsPreviewProps = {
    config: {
        testimonials?: {
            id: string;
            author: string;
            quote: string;
        }[];
    }
}

export function TestimonialsPreview({ config }: TestimonialsPreviewProps) {
    const { testimonials = [] } = config;

    return (
        <div className="space-y-6 rounded-lg border p-6">
            {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="text-center space-y-2">
                    <p className="italic">"{testimonial.quote}"</p>
                    <div className="flex items-center justify-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarFallback>{testimonial.author.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-semibold">{testimonial.author}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

    