export type MenuLocation = {
    id: string;
    name: string;
    description: string;
    theme: string;
};

export const menuLocations: MenuLocation[] = [
    // Magazine Pro
    { id: 'magazine-pro-header', name: 'Header Navigation', description: 'The main navigation bar in the header.', theme: 'Magazine Pro' },
    { id: 'magazine-pro-subheader', name: 'Sub-Header Navigation', description: 'A secondary navigation bar below the main header.', theme: 'Magazine Pro' },
    { id: 'magazine-pro-footer', name: 'Footer Navigation', description: 'Secondary links in the site footer.', theme: 'Magazine Pro' },

    // Minimalist Blog
    { id: 'minimalist-blog-header', name: 'Header Navigation', description: 'The main navigation links in the header.', theme: 'Minimalist Blog' },
    { id: 'minimalist-blog-subheader', name: 'Sub-Header Navigation', description: 'A secondary navigation bar below the main header.', theme: 'Minimalist Blog' },

    // Creative Portfolio
    { id: 'creative-portfolio-header', name: 'Header Navigation', description: 'The main navigation links in the header.', theme: 'Creative Portfolio' },
    { id: 'creative-portfolio-subheader', name: 'Sub-Header Navigation', description: 'A secondary navigation bar below the main header.', theme: 'Creative Portfolio' },
    { id: 'creative-portfolio-social', name: 'Social Links', description: 'Social media links, often in the footer.', theme: 'Creative Portfolio' },
    
    // Newspaper
    { id: 'newspaper-main-nav', name: 'Main Navigation', description: 'Primary navigation below the header.', theme: 'Newspaper' },
    { id: 'newspaper-subheader', name: 'Sub-Header Navigation', description: 'A secondary navigation bar below the main navigation.', theme: 'Newspaper' },

    // Tech Today
    { id: 'tech-today-header', name: 'Header Navigation', description: 'The main navigation bar in the header.', theme: 'Tech Today' },
    { id: 'tech-today-subheader', name: 'Sub-Header Navigation', description: 'A secondary navigation bar below the main header.', theme: 'Tech Today' },

    // Business
    { id: 'business-header', name: 'Header Navigation', description: 'The main navigation links in the header.', theme: 'Business' },
    { id: 'business-subheader', name: 'Sub-Header Navigation', description: 'A secondary navigation bar below the main header.', theme: 'Business' },

    // Sports
    { id: 'sports-header', name: 'Header Navigation', description: 'The main navigation links in the header.', theme: 'Sports' },
    { id: 'sports-subheader', name: 'Sub-Header Navigation', description: 'A secondary navigation bar below the main header.', theme: 'Sports' },

    // NewsPro
    { id: 'newspro-header', name: 'Header Navigation', description: 'The main navigation links in the header.', theme: 'NewsPro' },
    { id: 'newspro-subheader', name: 'Sub-Header Navigation', description: 'A secondary navigation bar below the main header.', theme: 'NewsPro' },

    // Vogue
    { id: 'vogue-header', name: 'Header Navigation', description: 'The main navigation links in the header.', theme: 'Vogue' },
    { id: 'vogue-subheader', name: 'Sub-Header Navigation', description: 'A secondary navigation bar below the main header.', theme: 'Vogue' },
];
