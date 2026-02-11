import { NextResponse } from 'next/server';

// Get an access token using Azure AD client credentials flow
async function getAccessToken() {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Token error: ${data.error_description || data.error}`);
  }

  return data.access_token;
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

    const outlookUser = process.env.OUTLOOK_USER_EMAIL;
    if (!outlookUser || !process.env.AZURE_CLIENT_ID || !process.env.AZURE_TENANT_ID || !process.env.AZURE_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Outlook calendar not configured.' },
        { status: 503 }
      );
    }

    const accessToken = await getAccessToken();

    const viewingLabel = viewingType === 'virtual' ? 'Virtual Demo' : 'Physical Viewing';
    const location = viewingType === 'physical'
      ? 'Bruton Gardens Apartment'
      : 'Virtual (link will be shared)';

    // Build start and end times
    const startDateTime = `${date}T${time}:00`;
    const endHour = String(parseInt(time.split(':')[0]) + 1).padStart(2, '0');
    const endDateTime = `${date}T${endHour}:${time.split(':')[1]}:00`;

    const event = {
      subject: `Bruton Gardens - ${viewingLabel} with ${name}`,
      body: {
        contentType: 'HTML',
        content: `
          <h3>New Booking via Bruton Gardens Website</h3>
          <p><strong>Viewing Type:</strong> ${viewingLabel}</p>
          <p><strong>Guest Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Notes:</strong> ${notes || 'None'}</p>
        `,
      },
      start: {
        dateTime: startDateTime,
        timeZone: 'Africa/Accra',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Africa/Accra',
      },
      location: {
        displayName: location,
      },
      attendees: [
        {
          emailAddress: {
            address: email,
            name: name,
          },
          type: 'required',
        },
      ],
      isReminderOn: true,
      reminderMinutesBeforeStart: 30,
    };

    // Create event on Bruton's Outlook calendar — sends invite to guest automatically
    const graphUrl = `https://graph.microsoft.com/v1.0/users/${outlookUser}/events`;

    const response = await fetch(graphUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Graph API error:', data);
      throw new Error(data.error?.message || 'Failed to create event');
    }

    return NextResponse.json({
      success: true,
      eventId: data.id,
      message: 'Booking confirmed! A calendar invite has been sent to your email.',
    });
  } catch (error) {
    console.error('Booking API error:', error);

    return NextResponse.json(
      { error: 'Failed to create booking. Please try again.' },
      { status: 500 }
    );
  }
}
