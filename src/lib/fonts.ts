
export type FontConfig = {
    name: string;
    loader: string; // The function name from next/font/google
    weights: ('400' | '500' | '600' | '700' | '800' | '900')[];
};

export const fontList: FontConfig[] = [
    { name: 'Inter', loader: 'Inter', weights: ['400', '500', '600', '700', '800', '900'] },
    { name: 'Poppins', loader: 'Poppins', weights: ['400', '500', '600', '700', '800', '900'] },
    { name: 'Roboto', loader: 'Roboto', weights: ['400', '500', '700', '900'] },
    { name: 'Lato', loader: 'Lato', weights: ['400', '700', '900'] },
    { name: 'Montserrat', loader: 'Montserrat', weights: ['400', '500', '600', '700', '800', '900'] },
    { name: 'Oswald', loader: 'Oswald', weights: ['400', '500', '600', '700'] },
    { name: 'Source Sans Pro', loader: 'Source_Sans_3', weights: ['400', '600', '700', '900'] },
    { name: 'Raleway', loader: 'Raleway', weights: ['400', '500', '600', '700', '800', '900'] },
    { name: 'Merriweather', loader: 'Merriweather', weights: ['400', '700', '900'] },
    { name: 'Playfair Display', loader: 'Playfair_Display', weights: ['400', '500', '600', '700', '800', '900'] },
];

    