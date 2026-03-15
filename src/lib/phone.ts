export function sanitizePhoneNumber(value: string) {
  return value.replace(/\D/g, "")
}
