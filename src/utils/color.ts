/**
 * 색상 변환 및 비교 유틸리티
 */

/**
 * HEX 색상을 RGB로 변환
 * @param hex HEX 색상값 (#RGB 또는 #RRGGBB)
 */
export function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

/**
 * RGB 색상을 HEX로 변환
 * @param r red (0-255)
 * @param g green (0-255)
 * @param b blue (0-255)
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 두 색상 간의 유클리드 거리 계산
 * @param color1 첫 번째 색상
 * @param color2 두 번째 색상
 */
export function colorDistance(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    return color1 === color2 ? 0 : 255 * Math.sqrt(3); // 최대 거리
  }

  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
}

/**
 * 색상 동등성 비교 (허용 오차 포함)
 * @param color1 첫 번째 색상
 * @param color2 두 번째 색상
 * @param tolerance 허용 오차 (0-255, 기본 0)
 */
export function colorsEqual(
  color1: string,
  color2: string,
  tolerance: number = 0
): boolean {
  // 정확히 일치
  if (color1 === color2) return true;

  // 허용 오차 적용
  if (tolerance > 0) {
    const distance = colorDistance(color1, color2);
    return distance <= tolerance;
  }

  return false;
}

/**
 * 색상이 밝은지 여부 판단
 * @param hex HEX 색상값
 */
export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;

  // 밝기 계산 (YIQ formula)
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 128;
}

/**
 * 색상이 어두운지 여부 판단
 * @param hex HEX 색상값
 */
export function isDarkColor(hex: string): boolean {
  return !isLightColor(hex);
}

/**
 * 대비율 계산 (접근성)
 * @param color1 전경색
 * @param color2 배경색
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 1;

  const getLuminance = (rgb: { r: number; g: number; b: number }) => {
    const a = [rgb.r, rgb.g, rgb.b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 대비율이 WCAG AA 기준을 충족하는지 확인
 * @param color1 전경색
 * @param color2 배경색
 * @param isLargeText 큰 텍스트 여부 (기본 false)
 */
export function passesWCAG_AA(
  color1: string,
  color2: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(color1, color2);
  const threshold = isLargeText ? 3 : 4.5;
  return ratio >= threshold;
}
