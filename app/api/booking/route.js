import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// Google Calendar API setup using service account
function getCalendarClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, notes, date, time, viewingType } = body;

    if (!name || !email || !phone || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId || !process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      return NextResponse.json(
        { error: 'Calendar not configured. Please set up Google Calendar API credentials.' },
        { status: 503 }
      );
    }

    const calendar = getCalendarClient();

    const viewingLabel = viewingType === 'virtual' ? 'Virtual Demo' : 'Physical Viewing';
    const location = viewingType === 'physical'
      ? 'Bruton Gardens Apartment'
      : 'Virtual (link will be shared)';

    // Build start and end times
    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour

    const event = {
      summary: `Bruton Gardens - ${viewingLabel} with ${name}`,
      description: [
        `Viewing Type: ${viewingLabel}`,
        `Guest Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        `Notes: ${notes || 'None'}`,
        '',
        'Booked via Bruton Gardens Website',
      ].join('\n'),
      location,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Africa/Accra',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Africa/Accra',
      },
      attendees: [
        { email, displayName: name },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    // Create event on Bruton's calendar and send invites to attendee
    const response = await calendar.events.insert({
      calendarId,
      resource: event,
      sendUpdates: 'all', // Sends email invite to the attendee automatically
    });

    return NextResponse.json({
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      message: 'Booking confirmed! A calendar invite has been sent to your email.',
    });
  } catch (error) {
    console.error('Booking API error:', error);

    if (error.code === 401 || error.code === 403) {
      return NextResponse.json(
        { error: 'Calendar authentication failed. Please check API credentials.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create booking. Please try again.' },
      { status: 500 }
    );
  }
}
