import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}

export function formatDateTimeVietnam(dateStr?: string | Date | null): string {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
  }).format(date);
}

export function normalizeApartment(apt: string): string {
  return apt.trim().toUpperCase().replace(/\s+/g, ' ');
}

export function sanitizeText(text: string): string {
  return text.trim().replace(/[<>]/g, '');
}

/**
 * Chuẩn hóa số điện thoại:
 * - Bỏ khoảng trắng, dấu chấm, dấu gạch ngang, ngoặc đơn
 * - Chuyển đầu +84 hoặc 84 thành 0
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.trim().replace(/[\s.\-()]/g, '');
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.substring(3);
  } else if (cleaned.startsWith('84') && cleaned.length >= 11) {
    cleaned = '0' + cleaned.substring(2);
  }
  return cleaned;
}

/**
 * Kiểm tra số điện thoại Việt Nam hợp lệ (10 chữ số bắt đầu bằng 03, 05, 07, 08, 09, 02)
 */
export function isValidVietnamesePhone(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  // Cho phép 10 chữ số tiêu chuẩn Việt Nam hoặc 9-11 số hợp lý
  const phoneRegex = /^(0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-9]|9[0-9]|2[0-9])[0-9]{7}$/;
  // Hỗ trợ thêm dạng tổng quát 10 chữ số bắt đầu bằng 0
  const generalRegex = /^0[0-9]{9}$/;
  return phoneRegex.test(normalized) || generalRegex.test(normalized);
}
