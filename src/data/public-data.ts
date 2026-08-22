export const serviceRecords = [
  { slug: 'general-dentistry', icon: 'heart' },
  { slug: 'dental-cleaning', icon: 'sparkles' },
  { slug: 'teeth-whitening', icon: 'sun' },
  { slug: 'dental-implants', icon: 'shield' },
  { slug: 'orthodontics', icon: 'smile' },
  { slug: 'childrens-dentistry', icon: 'baby' },
] as const;

export const doctorRecords = [
  { slug: 'alex-morgan', initials: 'AM', tone: 'bg-[#d9e8df]' },
  { slug: 'jordan-lee', initials: 'JL', tone: 'bg-[#e8dfd5]' },
  { slug: 'sam-taylor', initials: 'ST', tone: 'bg-[#d9e0e8]' },
] as const;

export const faqKeys = ['booking', 'checkups', 'cleaning', 'whitening', 'braces', 'children', 'implants', 'duration', 'bring', 'emergency'] as const;

export type ServiceRecord = (typeof serviceRecords)[number];
export type DoctorRecord = (typeof doctorRecords)[number];
