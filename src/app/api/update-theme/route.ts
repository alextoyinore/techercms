
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// This is a simple, insecure-by-default API route for updating CSS variables.
// In a real production app, you would want to add authentication and authorization here.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { colors } = body;

    if (!colors || typeof colors !== 'object') {
      return NextResponse.json({ error: 'Invalid color data provided.' }, { status: 400 });
    }

    const cssFilePath = path.join(process.cwd(), 'src', 'app', 'globals.css');
    let fileContent = await fs.readFile(cssFilePath, 'utf-8');

    // Find the :root block and update the variables
    const rootRegex = /:root\s*{([^}]*)}/;
    const match = fileContent.match(rootRegex);

    if (!match) {
      return NextResponse.json({ error: 'Could not find the :root block in globals.css.' }, { status: 500 });
    }

    let rootContent = match[1];
    
    // Update each color variable
    for (const key in colors) {
        if (key === 'sidebar') continue;
        const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        const regex = new RegExp(`(${cssVar}:\\s*)[^;]+;`);
        if (regex.test(rootContent)) {
            rootContent = rootContent.replace(regex, `$1${colors[key]};`);
        } else {
            // If the variable doesn't exist, add it.
            rootContent += `\n  ${cssVar}: ${colors[key]};`;
        }
    }
    
    fileContent = fileContent.replace(rootRegex, `:root {${rootContent}}`);
    
    await fs.writeFile(cssFilePath, fileContent, 'utf-8');

    return NextResponse.json({ message: 'Theme updated successfully.' });

  } catch (error: any) {
    console.error('Error updating theme:', error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
