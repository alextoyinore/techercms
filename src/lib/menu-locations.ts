
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

    // Business
    { id: 'business-header', name: 'Header Navigation', description: 'The main navigation links in the header.', theme: 'Business' },
    { id: 'business-subheader', name: 'Sub-Header Navigation', description: 'A secondary navigation bar below the main header.', theme: 'Business' },

    // NewsPro
    { id: 'newspro-header', name: 'Header Navigation', description: 'The main navigation links in the header.', theme: 'NewsPro' },
    { id: 'newspro-subheader', name: 'Sub-Header Navigation', description: 'A secondary navigation bar below the main header.', theme: 'NewsPro' },
];
