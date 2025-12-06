import { formatMoney, formatMoneyGHS, formatMoneyWithTooltip } from './formatMoney';

describe('formatMoney', () => {
  describe('basic formatting', () => {
    test('formats thousands with K', () => {
      expect(formatMoney(14000)).toBe('14K');
      expect(formatMoney(2500)).toBe('2.5K');
      expect(formatMoney(1000)).toBe('1K');
    });

    test('formats millions with M', () => {
      expect(formatMoney(10000000)).toBe('10M');
      expect(formatMoney(1500000)).toBe('1.5M');
      expect(formatMoney(1000000)).toBe('1M');
    });

    test('formats billions with B', () => {
      expect(formatMoney(1200000000)).toBe('1.2B');
      expect(formatMoney(5000000000)).toBe('5B');
    });

    test('formats trillions with T', () => {
      expect(formatMoney(3000000000000)).toBe('3T');
      expect(formatMoney(1500000000000)).toBe('1.5T');
    });

    test('shows numbers less than 1000 as-is', () => {
      expect(formatMoney(999)).toBe('999');
      expect(formatMoney(500)).toBe('500');
      expect(formatMoney(0)).toBe('0');
    });
  });

  describe('decimal handling', () => {
    test('respects decimal parameter', () => {
      expect(formatMoney(1550000, 1)).toBe('1.6M');
      expect(formatMoney(1550000, 2)).toBe('1.55M');
      expect(formatMoney(1500000, 0)).toBe('2M');
    });

    test('removes trailing zeros', () => {
      expect(formatMoney(10000000)).toBe('10M'); // not "10.0M"
      expect(formatMoney(2500000, 2)).toBe('2.5M'); // not "2.50M"
    });
  });

  describe('negative values', () => {
    test('handles negative numbers correctly', () => {
      expect(formatMoney(-14000)).toBe('-14K');
      expect(formatMoney(-1500000)).toBe('-1.5M');
      expect(formatMoney(-999)).toBe('-999');
    });
  });

  describe('currency symbol', () => {
    test('adds currency symbol prefix', () => {
      expect(formatMoney(14000, 1, 'GH₵')).toBe('GH₵14K');
      expect(formatMoney(1500000, 1, '$')).toBe('$1.5M');
      expect(formatMoney(999, 1, 'GH₵')).toBe('GH₵999');
    });
  });

  describe('edge cases', () => {
    test('handles null and undefined', () => {
      expect(formatMoney(null)).toBe('0');
      expect(formatMoney(undefined)).toBe('0');
      expect(formatMoney(null, 1, 'GH₵')).toBe('GH₵0');
    });

    test('handles non-numeric values', () => {
      expect(formatMoney('invalid')).toBe('0');
      expect(formatMoney(NaN)).toBe('0');
    });

    test('handles string numbers', () => {
      expect(formatMoney('14000')).toBe('14K');
      expect(formatMoney('1500000')).toBe('1.5M');
    });

    test('handles zero', () => {
      expect(formatMoney(0)).toBe('0');
      expect(formatMoney(0, 1, 'GH₵')).toBe('GH₵0');
    });
  });
});

describe('formatMoneyGHS', () => {
  test('formats with GH₵ symbol', () => {
    expect(formatMoneyGHS(14000)).toBe('GH₵14K');
    expect(formatMoneyGHS(1500000)).toBe('GH₵1.5M');
    expect(formatMoneyGHS(999)).toBe('GH₵999');
  });
});

describe('formatMoneyWithTooltip', () => {
  test('returns formatted and full values', () => {
    const result = formatMoneyWithTooltip(14500000, 1, 'GH₵');
    expect(result.formatted).toBe('GH₵14.5M');
    expect(result.full).toBe('GH₵14,500,000');
    expect(result.value).toBe(14500000);
  });

  test('formats full value with commas', () => {
    const result = formatMoneyWithTooltip(1234567);
    expect(result.full).toBe('1,234,567');
  });

  test('handles negative values in tooltip', () => {
    const result = formatMoneyWithTooltip(-14000, 1, 'GH₵');
    expect(result.formatted).toBe('-GH₵14K');
    expect(result.full).toBe('-GH₵14,000');
  });

  test('handles null values', () => {
    const result = formatMoneyWithTooltip(null, 1, 'GH₵');
    expect(result.formatted).toBe('GH₵0');
    expect(result.full).toBe('GH₵0');
  });
});
