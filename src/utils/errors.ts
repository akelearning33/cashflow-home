export function getThaiErrorMessage(error: unknown, fallback = 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง'): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
  if (normalized.includes('email not confirmed')) return 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ';
  if (normalized.includes('signup') && normalized.includes('disabled')) return 'อีเมลนี้ยังไม่ได้รับคำเชิญให้ใช้งาน';
  if (normalized.includes('rate limit')) return 'มีการลองหลายครั้งเกินไป กรุณารอสักครู่';
  if (normalized.includes('duplicate') || normalized.includes('unique')) return 'มีชื่อนี้อยู่แล้ว กรุณาใช้ชื่ออื่น';
  if (normalized.includes('not authenticated') || normalized.includes('session expired')) {
    return 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง';
  }
  if (normalized.includes('failed to fetch') || normalized.includes('network')) {
    return 'เชื่อมต่อระบบไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่';
  }

  return fallback;
}
