
export type MenuLocation = {
    id: string;
    name: string;
    description: string;
    theme: string;
};

export const menuLocations: MenuLocation[] = [
    // Business
    { id: 'business-header', name: 'Header Navigation', description: 'The main navigation links in the header.', theme: 'Business' },
    { id: 'business-subheader', name: 'Sub-Header Navigation', description: 'A secondary navigation bar below the main header.', theme: 'Business' },
];
