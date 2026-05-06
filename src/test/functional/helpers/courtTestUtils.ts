import { Court } from '../../../main/schemas/courtSchema';

export function generateRandomString(): string {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  const charactersLength = characters.length;
  for (let index = 0; index < 5; index += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function generateUppercaseRandomString(length = 4): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let index = 0; index < length; index += 1) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export function hasText(value: string | null | undefined): value is string {
  return Boolean(value && value.trim());
}

export function isPhoneLikeValue(value: string): boolean {
  return /\d/.test(value) && /^[+\d\s()-]+$/.test(value);
}

export function getContactName(contact: {
  courtContactDescription?: { name?: string | null; nameCy?: string | null } | null;
  courtContactDescriptionName?: string | null;
  courtContactDescriptionNameCy?: string | null;
}): { name: string; nameCy: string } | null {
  const name = contact.courtContactDescription?.name ?? contact.courtContactDescriptionName;
  const nameCy = contact.courtContactDescription?.nameCy ?? contact.courtContactDescriptionNameCy ?? name;

  if (!hasText(name) || !hasText(nameCy)) {
    return null;
  }

  return { name, nameCy };
}

export function getEnquiriesPhoneNumber(contactDetails: Court['courtContactDetails']): string | null {
  for (const contact of contactDetails) {
    const names = getContactName(contact);
    if (names?.name.toLowerCase() === 'enquiries' && hasText(contact.phoneNumber)) {
      return contact.phoneNumber;
    }
  }

  return null;
}

export function isCounterServiceOpeningHoursLabel(label: string): boolean {
  return label === 'Counter open' || label.startsWith('Counter service for') || label === 'Counter service';
}
