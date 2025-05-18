# RSVP Form Setup with Airtable

This document explains how to set up the RSVP form to store submissions in Airtable.

## Overview

The RSVP form uses a secure approach by:
1. Collecting form data in the frontend React component
2. Sending the data to a Next.js API route
3. The API route securely communicates with Airtable using API keys that are never exposed to the browser

## Step 1: Create an Airtable Base

1. Sign up for an Airtable account at https://airtable.com if you don't have one
2. Create a new base (database)
3. Create a table named "RSVPs" with the following fields:
   - Name (Single line text)
   - Status (Single select with options: yes, no, maybe)
   - Guest Count (Number)
   - Dietary Restrictions (Single line text)
   - Submission Date (Date)

## Step 2: Get Airtable API Credentials

1. Go to your [Airtable account page](https://airtable.com/account)
2. Under API section, generate an API key if you don't have one
3. Copy the API key
4. Go to the [Airtable API documentation](https://airtable.com/api) and select your base
5. Find your Base ID in the documentation (it's in the URL and looks like `appXXXXXXXXXXXXXX`)

## Step 3: Configure Environment Variables

Create a `.env.local` file in the root of your project with the following content:

```
# Airtable credentials (server-side only)
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_airtable_base_id
AIRTABLE_TABLE_NAME=RSVPs
```

Replace `your_airtable_api_key` and `your_airtable_base_id` with the values from Step 2.

## Step 4: Restart the Development Server

After setting up the environment variables, restart your Next.js development server for the changes to take effect:

```
npm run dev
```

## How It Works

1. When a user submits the RSVP form, the form data is sent to `/api/rsvp` endpoint
2. The API route validates the data and securely sends it to Airtable
3. Success or error responses are returned to the form
4. The form displays appropriate success or error messages to the user

## Security Considerations

- The Airtable API key is kept secure as a server-side environment variable
- All requests to Airtable are made from the server, never the client
- Basic validation is performed on both client and server side

## Customizing the Form

You can customize the form fields in two places:
1. The form schema in `src/components/ContentRSVP.tsx`
2. The API route in `src/app/api/rsvp/route.ts`

Make sure to keep both in sync if you add or remove fields. 