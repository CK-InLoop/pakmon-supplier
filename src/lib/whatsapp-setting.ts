export const WHATSAPP_SETTING_KEY = 'contact.whatsapp';
export const DEFAULT_WHATSAPP_PHONE = '+971 56 433 2583';

export function normalizeWhatsAppPhone(input: string) {
  const value = input.trim();
  if (!value || !/^[+\d\s().-]+$/.test(value)) {
    throw new Error('Enter a valid phone number with country code, for example +971 56 433 2583.');
  }

  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length < 8 || digits.length > 15) {
    throw new Error('Phone number must contain 8 to 15 digits including the country code.');
  }

  return { phone: value, digits };
}

export function readWhatsAppPhone(value: unknown) {
  if (value && typeof value === 'object' && 'phone' in value) {
    const phone = (value as { phone?: unknown }).phone;
    if (typeof phone === 'string') return phone;
  }
  if (typeof value === 'string') return value;
  return DEFAULT_WHATSAPP_PHONE;
}
