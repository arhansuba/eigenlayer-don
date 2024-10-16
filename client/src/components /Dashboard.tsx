import React from 'react';
import { useQuery } from 'react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fetchDataFeed } from '../api/dataFeed';

const DataFeedChart = () => {
  const { data, isLoading, error } = useQuery('dataFeed', fetchDataFeed, {
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching data</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-time Data Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <LineChart width={600} height={300} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#8884d8" />
        </LineChart>
      </CardContent>
    </Card>
  );
};

const DataSourceList = () => {
  const { data, isLoading, error } = useQuery('dataSources', fetchDataSources);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching data sources</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {data.map((source) => (
            <li key={source.id}>
              {source.name} - Reliability: {source.reliability.toFixed(2)}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Data Feed Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DataFeedChart />
        <DataSourceList />
      </div>
    </div>
  );
};

export default Dashboard;