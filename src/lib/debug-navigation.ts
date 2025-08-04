// Debug helper to track navigation
let navigationHistory: { page: string; timestamp: number }[] = [];

export function logNavigation(page: string) {
  const now = Date.now();
  navigationHistory.push({ page, timestamp: now });
  
  // Keep only last 10 entries
  if (navigationHistory.length > 10) {
    navigationHistory = navigationHistory.slice(-10);
  }
  
  // Check for rapid navigation (potential loop)
  const recentNavigations = navigationHistory.filter(n => now - n.timestamp < 3000);
  if (recentNavigations.length >= 3) {
    console.warn('[Navigation] Potential redirect loop detected!');
    console.table(recentNavigations);
  }
  
  console.log(`[Navigation] Navigated to ${page} at ${new Date(now).toISOString()}`);
}

export function getNavigationHistory() {
  return navigationHistory;
}