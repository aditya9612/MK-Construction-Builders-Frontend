import { create } from 'zustand';
import { enquiryService } from '../services/api/enquiryService';
import { toast } from './uiStore';

function clampCount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export const useEnquiryStore = create((set, get) => ({
  unreadCount: 0,
  lastPolledCount: null,

  setUnreadCount: (count) => {
    const next = clampCount(count);
    set({ unreadCount: next, lastPolledCount: next });
  },

  adjustUnread: (delta) => {
    const next = clampCount(get().unreadCount + Number(delta || 0));
    set({ unreadCount: next, lastPolledCount: next });
  },

  fetchUnreadCount: async ({ notifyOnIncrease = true } = {}) => {
    try {
      const count = await enquiryService.getUnreadCount();
      const previous = get().lastPolledCount;
      set({ unreadCount: count, lastPolledCount: count });
      if (notifyOnIncrease && previous != null && count > previous) {
        toast('New website enquiry');
      }
      return count;
    } catch {
      return get().unreadCount;
    }
  },
}));
