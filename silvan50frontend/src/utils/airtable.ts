/**
 * RSVP data interface
 */
export interface RSVPData {
  name: string;
  attending: 'yes' | 'no' | 'maybe';
  guestCount: number;
  dietaryRestrictions?: string;
}

/**
 * Save RSVP data through the API endpoint
 */
export const saveRSVP = async (data: RSVPData): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const response = await fetch('/api/rsvp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: result.error || `Error: ${response.status}`,
      };
    }

    return result;
  } catch (error) {
    console.error('Error saving RSVP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Check if a name already exists through the API endpoint
 */
export const checkExistingRSVP = async (name: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/rsvp?name=${encodeURIComponent(name)}`);
    
    if (!response.ok) {
      console.error('Error checking RSVP:', await response.text());
      return false;
    }
    
    const result = await response.json();
    return result.exists;
  } catch (error) {
    console.error('Error checking existing RSVP:', error);
    return false;
  }
}; 