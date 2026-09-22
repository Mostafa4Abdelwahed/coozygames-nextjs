import { PhoneNumberUtil } from 'google-libphonenumber'

export const COUNTRY_CODES = [
  { code: 'EG', dial: '+20', label: 'مصر' },
  { code: 'SA', dial: '+966', label: 'السعودية' },
  { code: 'AE', dial: '+971', label: 'الإمارات' },
  { code: 'KW', dial: '+965', label: 'الكويت' },
  { code: 'QA', dial: '+974', label: 'قطر' },
  { code: 'BH', dial: '+973', label: 'البحرين' },
  { code: 'OM', dial: '+968', label: 'عُمان' },
  { code: 'JO', dial: '+962', label: 'الأردن' },
  { code: 'IQ', dial: '+964', label: 'العراق' },
  { code: 'MA', dial: '+212', label: 'المغرب' },
  { code: 'DZ', dial: '+213', label: 'الجزائر' },
  { code: 'TN', dial: '+216', label: 'تونس' },
  { code: 'US', dial: '+1', label: 'أمريكا' },
  { code: 'GB', dial: '+44', label: 'بريطانيا' },
  { code: 'DE', dial: '+49', label: 'ألمانيا' },
  { code: 'FR', dial: '+33', label: 'فرنسا' },
]

const NATIONAL_NUMBER_RE = /^[0-9]{6,14}$/

export function validatePhoneNumber(value: string, region: string): string {
  const digits = value.replace(/[\s-]/g, '')
  if (!NATIONAL_NUMBER_RE.test(digits)) {
    return 'رقم الهاتف يجب أن يكون من 6 إلى 14 رقمًا'
  }
  try {
    const util = PhoneNumberUtil.getInstance()
    const number = util.parse(digits, region)
    if (!util.isValidNumber(number)) {
      return 'رقم الهاتف غير صحيح، تحقق من الرقم وكود الدولة'
    }
  } catch {
    return 'رقم الهاتف غير صحيح، تحقق من الرقم وكود الدولة'
  }
  return ''
}
