/**
 * Recent Items Hook
 *
 * Track and manage recently viewed items with local storage
 * persistence and analytics integration.
 */

import { useState, useEffect, useCallback } from 'react';

export interface RecentItem {
  id: string;
  type: 'issue' | 'project' | 'user' | 'dashboard' | 'filter';
  title: string;
  subtitle?: string;
  key?: string;
  path: string;
  lastVisited: Date;
  visitCount: number;
  metadata?: {
    status?: string;
    priority?: string;
    assignee?: string;
    projectKey?: string;
  };
}

interface UseRecentItemsOptions {
  maxItems?: number;
  storageKey?: string;
  enableAnalytics?: boolean;
}

export const useRecentItems = (options: UseRecentItemsOptions = {}) => {
  const {
    maxItems = 20,
    storageKey = 'jira-recent-items',
    enableAnalytics = true,
  } = options;

  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load items from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const items: RecentItem[] = JSON.parse(stored).map((item: any) => ({
          ...item,
          lastVisited: new Date(item.lastVisited),
        }));
        setRecentItems(items);
      }
    } catch (error) {
      console.warn('Failed to load recent items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  // Save items to localStorage
  const saveToStorage = useCallback((items: RecentItem[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (error) {
      console.warn('Failed to save recent items:', error);
    }
  }, [storageKey]);

  // Add or update an item
  const addItem = useCallback((newItem: Omit<RecentItem, 'lastVisited' | 'visitCount'>) => {
    setRecentItems(prev => {
      const existing = prev.find(item => item.id === newItem.id && item.type === newItem.type);

      if (existing) {
        // Update existing item
        const updated = prev.map(item =>
          item.id === newItem.id && item.type === newItem.type
            ? {
                ...item,
                ...newItem,
                lastVisited: new Date(),
                visitCount: item.visitCount + 1,
              }
            : item
        );

        // Move to top
        const updatedItem = updated.find(item => item.id === newItem.id && item.type === newItem.type)!;
        const filtered = updated.filter(item => !(item.id === newItem.id && item.type === newItem.type));
        const result = [updatedItem, ...filtered].slice(0, maxItems);

        saveToStorage(result);
        return result;
      } else {
        // Add new item
        const item: RecentItem = {
          ...newItem,
          lastVisited: new Date(),
          visitCount: 1,
        };

        const result = [item, ...prev].slice(0, maxItems);
        saveToStorage(result);
        return result;
      }
    });

    // Track analytics if enabled
    if (enableAnalytics) {
      trackItemVisit(newItem);
    }
  }, [maxItems, saveToStorage, enableAnalytics]);

  // Remove an item
  const removeItem = useCallback((id: string, type: RecentItem['type']) => {
    setRecentItems(prev => {
      const filtered = prev.filter(item => !(item.id === id && item.type === type));
      saveToStorage(filtered);
      return filtered;
    });
  }, [saveToStorage]);

  // Clear all items
  const clearAll = useCallback(() => {
    setRecentItems([]);
    saveToStorage([]);
  }, [saveToStorage]);

  // Get items by type
  const getItemsByType = useCallback((type: RecentItem['type']) => {
    return recentItems.filter(item => item.type === type);
  }, [recentItems]);

  // Get frequently visited items
  const getFrequentItems = useCallback((limit = 10) => {
    return [...recentItems]
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, limit);
  }, [recentItems]);

  // Get recently visited items from specific time period
  const getRecentItemsSince = useCallback((hours = 24) => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return recentItems.filter(item => item.lastVisited > cutoff);
  }, [recentItems]);

  // Search within recent items
  const searchRecentItems = useCallback((query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return recentItems.filter(item =>
      item.title.toLowerCase().includes(lowercaseQuery) ||
      item.subtitle?.toLowerCase().includes(lowercaseQuery) ||
      item.key?.toLowerCase().includes(lowercaseQuery) ||
      item.metadata?.projectKey?.toLowerCase().includes(lowercaseQuery)
    );
  }, [recentItems]);

  // Analytics tracking
  const trackItemVisit = useCallback((item: Omit<RecentItem, 'lastVisited' | 'visitCount'>) => {
    // In a real app, this would send analytics data
    console.log('📈 Item visited:', {
      type: item.type,
      id: item.id,
      title: item.title,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Get item statistics
  const getStatistics = useCallback(() => {
    const totalVisits = recentItems.reduce((sum, item) => sum + item.visitCount, 0);
    const typeBreakdown = recentItems.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostVisited = recentItems.reduce((most, item) =>
      item.visitCount > (most?.visitCount || 0) ? item : most
    , null);

    return {
      totalItems: recentItems.length,
      totalVisits,
      typeBreakdown,
      mostVisited,
      averageVisitsPerItem: totalVisits / Math.max(recentItems.length, 1),
    };
  }, [recentItems]);

  return {
    // Data
    recentItems,
    isLoading,

    // Actions
    addItem,
    removeItem,
    clearAll,

    // Queries
    getItemsByType,
    getFrequentItems,
    getRecentItemsSince,
    searchRecentItems,
    getStatistics,

    // Computed values
    hasItems: recentItems.length > 0,
    issueCount: recentItems.filter(item => item.type === 'issue').length,
    projectCount: recentItems.filter(item => item.type === 'project').length,
    recentIssues: recentItems.filter(item => item.type === 'issue').slice(0, 5),
    recentProjects: recentItems.filter(item => item.type === 'project').slice(0, 3),
  };
};