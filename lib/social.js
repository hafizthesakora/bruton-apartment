/** Turn settings.social into renderable links; entries with no value are dropped. */
export function socialLinks(social = {}) {
  const wa = String(social.whatsapp || '').replace(/\D/g, '');
  return [
    wa && { name: 'WhatsApp', url: `https://wa.me/${wa}` },
    social.facebook && { name: 'Facebook', url: social.facebook },
    social.tiktok && { name: 'TikTok', url: social.tiktok },
  ].filter(Boolean);
}
