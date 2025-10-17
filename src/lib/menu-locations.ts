export type MenuLocation = {
    id: string;
    name: string;
    description: string;
    theme: string;
};

export const menuLocations: MenuLocation[] = [
    // Magazine Pro
    { id: 'magazine-pro-header', name: 'Header Navigation', description: 'The main navigation bar in the header.', theme: 'Magazine Pro' },
    { id: 'magazine-pro-footer', name: 'Footer Navigation', description: 'Secondary links in the site footer.', theme: 'Magazine Pro' },

    // Minimalist Blog
    { id: 'minimalist-blog-header', name: 'Header Navigation', description: 'The main navigation links in the header.', theme: 'Minimalist Blog' },

    // Creative Portfolio
    { id: 'creative-portfolio-header', name: 'Header Navigation', description: 'The main navigation links in the header.', theme: 'Creative Portfolio' },
    { id: 'creative-portfolio-social', name: 'Social Links', description: 'Social media links, often in the footer.', theme: 'Creative Portfolio' },
    
    // Newspaper
    { id: 'newspaper-main-nav', name: 'Main Navigation', description: 'Primary navigation below the header.', theme: 'Newspaper' },

    // Tech Today
    { id: 'tech-today-header', name: 'Header Navigation', description: 'The main navigation bar in the header.', theme: 'Tech Today' },

    // Business
    { id: 'business-header', name: 'Header Navigation', description: 'The main navigation links in the header.', theme: 'Business' },

    // Sports
    { id: 'sports-header', name: 'Header Navigation', description: 'The main navigation links in the header.', theme: 'Sports' },

    // NewsPro
    { id: 'newspro-header', name: 'Header Navigation', description: 'The main navigation links in the header.', theme: 'NewsPro' },

    // Vogue
    { id: 'vogue-header', name: 'Header Navigation', description: 'The main navigation links in the header.', theme: 'Vogue' },
];
