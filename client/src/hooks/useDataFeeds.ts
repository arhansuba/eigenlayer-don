import { useQuery } from 'react-query';
import { fetchDataFeed } from '../api/dataFeed';

export const useDataFeed = () => {
  return useQuery('dataFeed', fetchDataFeed, {
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};