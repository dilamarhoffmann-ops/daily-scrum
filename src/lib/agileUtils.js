export const getWorkingDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start) || isNaN(end)) return 0;
  
  let count = 0;
  let cur = new Date(start);
  
  // Clone to avoid mutation of the original start date
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++; 
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

export const FOCUS_FACTOR = 0.8;
