import { useEffect } from 'react';
import { useEnquiryStore } from '../store/enquiryStore';

const POLL_MS = 20000;

export function useEnquiryUnreadPoll() {
  const fetchUnreadCount = useEnquiryStore((state) => state.fetchUnreadCount);

  useEffect(() => {
    const poll = () => {
      if (document.hidden) return;
      fetchUnreadCount();
    };

    poll();
    const timer = window.setInterval(poll, POLL_MS);

    const onVisibility = () => {
      if (!document.hidden) fetchUnreadCount();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchUnreadCount]);
}
