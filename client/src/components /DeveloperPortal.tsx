import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchAPIDocumentation, generateAPIKey } from '../api/developerAPI';

const APIDocumentation = () => {
  const { data, isLoading, error } = useQuery('apiDocs', fetchAPIDocumentation);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching API documentation</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Documentation</CardTitle>
      </CardHeader>
      <CardContent>
        <div dangerouslySetInnerHTML={{ __html: data }} />
      </CardContent>
    </Card>
  );
};

const APIKeyManagement = () => {
  const [apiKey, setApiKey] = useState('');
  const generateKeyMutation = useMutation(generateAPIKey, {
    onSuccess: (data: { apiKey: React.SetStateAction<string>; }) => setApiKey(data.apiKey),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Key Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={() => generateKeyMutation.mutate()}>Generate API Key</Button>
        {apiKey && (
          <div className="mt-4">
            <p>Your API Key:</p>
            <Input readOnly value={apiKey} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ExampleCode = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Example Code</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="bg-gray-100 p-4 rounded">
          {`
// Example API call
fetch('https://api.example.com/data', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})
.then(response => response.json())
.then(data => console.log(data));
          `}
        </pre>
      </CardContent>
    </Card>
  );
};

const DeveloperPortal = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Developer Portal</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <APIDocumentation />
        <APIKeyManagement />
        <ExampleCode />
      </div>
    </div>
  );
};

export default DeveloperPortal;