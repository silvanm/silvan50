import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Define the path to the manifest file in the public directory
    const manifestPath = path.join(process.cwd(), 'public', 'data', 'manifest.json');
    
    // Check if the file exists
    if (!fs.existsSync(manifestPath)) {
      return NextResponse.json({ error: 'Manifest file not found' }, { status: 404 });
    }
    
    // Read the file
    const fileContents = fs.readFileSync(manifestPath, 'utf8');
    
    // Parse the JSON
    const manifestData = JSON.parse(fileContents);
    
    // List all the files in the data directory
    const dataDir = path.join(process.cwd(), 'public', 'data');
    const files = fs.readdirSync(dataDir);
    
    // Return both the manifest data and the list of files
    return NextResponse.json({
      manifest: manifestData,
      files: files,
      manifestPath: manifestPath
    });
  } catch (error) {
    console.error('Error reading manifest:', error);
    return NextResponse.json({ 
      error: 'Failed to read manifest',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 