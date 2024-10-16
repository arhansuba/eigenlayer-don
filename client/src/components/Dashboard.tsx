import { Card } from 'antd';
import React from 'react';
import { useQuery } from 'react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { CardHeader, CardTitle, CardContent } from './ui/card';


const DataFeedChart = () => {
  const { data, isLoading, error } = useQuery<{ timestamp: string; value: number }[]>('dataFeed', fetchDataFeed, {
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
  const { data, isLoading, error } = useQuery<{ id: React.Key | null | undefined; name: string; reliability: number }[]>('dataSources', fetchDataSources);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching data sources</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {data && data.map((source: { id: React.Key | null | undefined; name: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; reliability: number; }) => (
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

async function fetchDataSources(): Promise<{ id: React.Key | null | undefined; name: string; reliability: number }[]> {
  const response = await fetch('/api/data-sources');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}

export default Dashboard;

async function fetchDataFeed(): Promise<{ timestamp: string; value: number }[]> {
  const response = await fetch('/api/data-feed');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}
