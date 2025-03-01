import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get the absolute path to the data file
    const dataFilePath = path.join(process.cwd(), 'data', 'radical_data_final.json');
    
    // Read the data file
    const fileContents = fs.readFileSync(dataFilePath, 'utf8');
    const data = JSON.parse(fileContents);
    
    // Return the data as JSON
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading radical data:', error);
    return NextResponse.json(
      { error: 'Failed to load radical data' },
      { status: 500 }
    );
  }
} 