import { NextResponse } from 'next/server';

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
    const { name, email, phone, country, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const outlookUser = process.env.OUTLOOK_USER_EMAIL;
    if (!outlookUser || !process.env.AZURE_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Email not configured' },
        { status: 503 }
      );
    }

    const accessToken = await getAccessToken();

    // Send email to Bruton's inbox from info@brutongardens.com
    const mailPayload = {
      message: {
        subject: `New Enquiry from ${name} — Bruton Gardens Website`,
        body: {
          contentType: 'HTML',
          content: `
            <h2>New Contact Enquiry</h2>
            <table style="border-collapse:collapse;font-family:Arial,sans-serif;">
              <tr><td style="padding:8px;font-weight:bold;">Name:</td><td style="padding:8px;">${name}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;">Email:</td><td style="padding:8px;"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:8px;font-weight:bold;">Phone:</td><td style="padding:8px;">${phone || 'Not provided'}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;">Country:</td><td style="padding:8px;">${country || 'Not provided'}</td></tr>
            </table>
            <h3>Message:</h3>
            <p style="background:#f5f5f5;padding:16px;border-radius:8px;">${message.replace(/\n/g, '<br>')}</p>
            <hr>
            <p style="color:#888;font-size:12px;">Sent from Bruton Gardens & Apartments website contact form</p>
          `,
        },
        toRecipients: [
          {
            emailAddress: {
              address: outlookUser,
              name: 'Bruton Gardens',
            },
          },
        ],
        replyTo: [
          {
            emailAddress: {
              address: email,
              name: name,
            },
          },
        ],
      },
      saveToSentItems: true,
    };

    const graphUrl = `https://graph.microsoft.com/v1.0/users/${outlookUser}/sendMail`;

    const response = await fetch(graphUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mailPayload),
    });

    if (!response.ok) {
      const data = await response.json();
      console.error('Graph Mail error:', data);
      throw new Error(data.error?.message || 'Failed to send email');
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent to our team.',
    });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    );
  }
}
