import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import { FileText, ImageIcon, Folder, Tag, Users } from "lucide-react";
  import { PageHeader } from "@/components/page-header";
  
  export default function Dashboard() {
    const stats = [
      { title: "Total Posts", value: "1,234", icon: FileText },
      { title: "Media Items", value: "567", icon: ImageIcon },
      { title: "Categories", value: "23", icon: Folder },
      { title: "Tags", value: "89", icon: Tag },
    ];
  
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Dashboard" description="Welcome back, Admin!" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        <li className="flex items-center gap-4">
                            <Users className="h-5 w-5 text-muted-foreground"/>
                            <p className="text-sm">New user <span className="font-semibold">John Doe</span> signed up.</p>
                            <time className="ml-auto text-xs text-muted-foreground">2 min ago</time>
                        </li>
                        <li className="flex items-center gap-4">
                            <FileText className="h-5 w-5 text-muted-foreground"/>
                            <p className="text-sm"><span className="font-semibold">Jane Smith</span> published a new post: "The Future of AI".</p>
                            <time className="ml-auto text-xs text-muted-foreground">1 hour ago</time>
                        </li>
                        <li className="flex items-center gap-4">
                            <ImageIcon className="h-5 w-5 text-muted-foreground"/>
                            <p className="text-sm">3 new images uploaded to the media library.</p>
                            <time className="ml-auto text-xs text-muted-foreground">4 hours ago</time>
                        </li>
                    </ul>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Quick Draft</CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-muted-foreground">
                       More dashboard widgets and content coming soon.
                   </p>
                </CardContent>
            </Card>
        </div>
      </div>
    );
  }
  