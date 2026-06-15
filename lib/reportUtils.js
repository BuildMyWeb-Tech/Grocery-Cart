// lib/reportUtils.js
// Shared utilities for the Sales Reporting System
// All date ranges computed in IST (UTC+5:30)

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function nowIST() {
  return new Date(Date.now() + IST_OFFSET_MS);
}

function startOfDayIST(istDate) {
  const d = new Date(istDate);
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() - IST_OFFSET_MS);
}

function endOfDayIST(istDate) {
  const d = new Date(istDate);
  d.setUTCHours(23, 59, 59, 999);
  return new Date(d.getTime() - IST_OFFSET_MS);
}

// Build { gte, lte } Prisma date filter — IST calendar-day aligned
// Returns null for invalid custom ranges (callers must return 400)
export function buildDateRange(period, from, to) {
  const now = nowIST();

  switch (period) {
    case 'today':
      return { gte: startOfDayIST(now), lte: endOfDayIST(now) };

    case 'yesterday': {
      const y = new Date(now);
      y.setUTCDate(y.getUTCDate() - 1);
      return { gte: startOfDayIST(y), lte: endOfDayIST(y) };
    }

    case 'week': {
      const weekStart = new Date(now);
      weekStart.setUTCDate(now.getUTCDate() - now.getUTCDay());
      return { gte: startOfDayIST(weekStart), lte: endOfDayIST(now) };
    }

    case 'month': {
      const monthStart = new Date(now);
      monthStart.setUTCDate(1);
      return { gte: startOfDayIST(monthStart), lte: endOfDayIST(now) };
    }

    case 'year': {
      const yearStart = new Date(now);
      yearStart.setUTCMonth(0, 1);
      return { gte: startOfDayIST(yearStart), lte: endOfDayIST(now) };
    }

    case 'custom': {
      if (!from || !to) return null;
      const fromIST = new Date(from + 'T00:00:00.000Z');
      const toIST   = new Date(to   + 'T00:00:00.000Z');
      if (isNaN(fromIST.getTime()) || isNaN(toIST.getTime())) return null;
      return {
        gte: new Date(fromIST.getTime() - IST_OFFSET_MS),
        lte: new Date(toIST.getTime()   - IST_OFFSET_MS + 24 * 60 * 60 * 1000 - 1),
      };
    }

    default:
      return { gte: startOfDayIST(now), lte: endOfDayIST(now) };
  }
}

export function buildComparisonRanges(comparisonType) {
  const now = nowIST();

  switch (comparisonType) {
    case 'today_vs_yesterday': {
      const yesterday = new Date(now);
      yesterday.setUTCDate(now.getUTCDate() - 1);
      return {
        current:  { gte: startOfDayIST(now),       lte: endOfDayIST(now) },
        previous: { gte: startOfDayIST(yesterday),  lte: endOfDayIST(yesterday) },
        labels: ['Today', 'Yesterday'],
      };
    }

    case 'month_vs_last_month': {
      const thisMonthStart = new Date(now);
      thisMonthStart.setUTCDate(1);

      const lastMonthStart = new Date(now);
      lastMonthStart.setUTCMonth(now.getUTCMonth() - 1, 1);

      const lastMonthEnd = new Date(now);
      lastMonthEnd.setUTCDate(0);

      return {
        current:  { gte: startOfDayIST(thisMonthStart), lte: endOfDayIST(now) },
        previous: { gte: startOfDayIST(lastMonthStart), lte: endOfDayIST(lastMonthEnd) },
        labels: ['This Month', 'Last Month'],
      };
    }

    case 'year_vs_last_year': {
      const thisYearStart = new Date(now);
      thisYearStart.setUTCMonth(0, 1);

      const lastYearStart = new Date(now);
      lastYearStart.setUTCFullYear(now.getUTCFullYear() - 1, 0, 1);

      const lastYearEnd = new Date(now);
      lastYearEnd.setUTCFullYear(now.getUTCFullYear() - 1, 11, 31);

      return {
        current:  { gte: startOfDayIST(thisYearStart), lte: endOfDayIST(now) },
        previous: { gte: startOfDayIST(lastYearStart), lte: endOfDayIST(lastYearEnd) },
        labels: ['This Year', 'Last Year'],
      };
    }

    default:
      return null;
  }
}

// Calculate % growth. Returns { growth, note }
export function calcGrowth(current, previous) {
  if (previous === 0) {
    return { growth: current > 0 ? 100 : 0, note: 'No previous data' };
  }
  return {
    growth: Math.round(((current - previous) / previous) * 100 * 10) / 10,
    note: null,
  };
}

export const round2 = (n) => Math.round(n * 100) / 100;

// Format UTC Date → IST 'MMM D' label
export function fmtDay(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
  });
}

// Convert UTC Date → IST YYYY-MM-DD key for day bucketing
export function toISTDateKey(utcDate) {
  return new Date(utcDate).toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata',
  });
}

// Fill daily gaps so charts have no missing days
export function fillDailyGaps(data, dateRange) {
  const map = Object.fromEntries(data.map((d) => [d.date, d]));
  const result = [];
  const cursor = new Date(dateRange.gte);
  const end    = new Date(dateRange.lte);
  while (cursor <= end) {
    const key = cursor.toISOString().split('T')[0];
    result.push(map[key] || { date: key, label: fmtDay(cursor), revenue: 0, count: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

// Excluded statuses from revenue calculations
export const EXCLUDED_STATUSES = ['CANCELLED', 'RETURNED'];