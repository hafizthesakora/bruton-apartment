import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { updateJSON } = vi.hoisted(() => ({ updateJSON: vi.fn() }));
vi.mock('@/lib/data', () => ({ updateJSON }));
import { POST } from '@/app/api/contact/route';

const input = { name: 'Ama Test', email: 'ama@example.com', message: 'Please arrange a viewing.' };
const request = (body: unknown) => new Request('http://localhost/api/contact', {
  method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
});

beforeEach(() => {
  updateJSON.mockReset().mockResolvedValue([]);
  for (const key of ['OUTLOOK_USER_EMAIL', 'AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET']) vi.stubEnv(key, '');
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('contact enquiries', () => {
  it('saves a valid enquiry without an email provider', async () => {
    const response = await POST(request(input));
    expect(response.status).toBe(200);
    const [filename, update] = updateJSON.mock.calls[0];
    expect(filename).toBe('enquiries.json');
    expect(update([{ id: 'existing' }])).toEqual([
      expect.objectContaining({ ...input, phone: '', country: '', read: false }), { id: 'existing' },
    ]);
  });

  it.each([{ ...input, email: 'invalid' }, { ...input, message: {} }, { ...input, name: ' ' }, null])('rejects invalid input: %j', async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(updateJSON).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON', async () => {
    expect((await POST(new Request('http://localhost/api/contact', { method: 'POST', body: '{' }))).status).toBe(400);
  });

  it('reports failure if the enquiry could not be persisted', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    updateJSON.mockRejectedValue(new Error('DB unavailable'));
    expect((await POST(request(input))).status).toBe(500);
  });

  it('keeps the saved enquiry when Outlook is unavailable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    for (const key of ['OUTLOOK_USER_EMAIL', 'AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET']) vi.stubEnv(key, 'configured');
    const fetch = vi.fn().mockRejectedValue(new Error('Outlook unavailable'));
    vi.stubGlobal('fetch', fetch);
    expect((await POST(request(input))).status).toBe(200);
    expect(updateJSON).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('escapes guest content in notification HTML', async () => {
    for (const key of ['OUTLOOK_USER_EMAIL', 'AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET']) vi.stubEnv(key, 'configured');
    const fetch = vi.fn()
      .mockResolvedValueOnce(Response.json({ access_token: 'token' }))
      .mockResolvedValueOnce(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetch);
    expect((await POST(request({ ...input, message: '<img src=x>\nHello' }))).status).toBe(200);
    const mail = JSON.parse(fetch.mock.calls[1][1].body);
    expect(mail.message.body.content).toContain('&lt;img src=x&gt;<br>Hello');
    expect(mail.message.body.content).not.toContain('<img src=x>');
  });
});
