import { useState, useEffect } from 'react';
import axios from 'axios';

export const useHealthCheck = (url: string, interval = 30000) => {
  const [healthy, setHealthy] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        await axios.get(`${url}/health`, { timeout: 5000 });
        setHealthy(true);
      } catch {
        setHealthy(false);
      }
    };

    check();
    const timer = setInterval(check, interval);
    return () => clearInterval(timer);
  }, [url, interval]);

  return healthy;
};