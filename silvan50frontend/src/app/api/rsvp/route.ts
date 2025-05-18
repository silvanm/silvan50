import { NextResponse } from 'next/server';
import Airtable from 'airtable';

// Configure Airtable with server-side env variables (not exposed to client)
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'RSVPs';

// Validate environment variables
if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('Missing Airtable environment variables');
}

// Initialize Airtable
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID!);
const table = base(AIRTABLE_TABLE_NAME);

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { name, attending, guestCount, dietaryRestrictions } = body;
    
    // Basic validation
    if (!name || !attending || !guestCount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create record in Airtable
    const record = await table.create({
      Name: name,
      Status: attending,
      'Guest Count': guestCount,
      'Dietary Restrictions': dietaryRestrictions || '',
      'Submission Date': new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      id: record.getId(),
    });
  } catch (error) {
    console.error('Error saving RSVP:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const name = url.searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name parameter is required' },
        { status: 400 }
      );
    }

    // Check if name exists
    const records = await table
      .select({
        filterByFormula: `FIND("${name}", {Name}) > 0`,
      })
      .firstPage();
    
    return NextResponse.json({
      exists: records.length > 0,
    });
  } catch (error) {
    console.error('Error checking RSVP:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to check existing RSVP' },
      { status: 500 }
    );
  }
} 