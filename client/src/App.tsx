import React, { useState } from "react";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { AptosWalletAdapterProvider, InputTransactionData, useWallet } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network, AccountAddressInput, InputSubmitTransactionData } from "@aptos-labs/ts-sdk";
import "./App.css";

// Configure Aptos
const aptosConfig = new AptosConfig({ network: Network.CUSTOM });
const aptos = new Aptos(aptosConfig);

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  return (
    <AptosWalletAdapterProvider plugins={[]} autoConnect={true}>
      <div className="App">
        <header className="App-header">
          <h1>Decentralized Oracle Network</h1>
          <WalletSelector />
          <nav>
            <button onClick={() => setCurrentPage('dashboard')}>Dashboard</button>
            <button onClick={() => setCurrentPage('stakeManagement')}>Stake Management</button>
            <button onClick={() => setCurrentPage('developerPortal')}>Developer Portal</button>
          </nav>
        </header>
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'stakeManagement' && <StakeManagement />}
        {currentPage === 'developerPortal' && <DeveloperPortal />}
      </div>
    </AptosWalletAdapterProvider>
  );
}

function Dashboard() {
  const { signAndSubmitTransaction, account, connected } = useWallet();
  const [dataType, setDataType] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [data, setData] = useState<string | null>(null);

  async function requestData() {
    if (!connected || !account) {
      alert("Please connect your wallet first.");
      return;
    }

    const transaction: InputTransactionData = {
      data: {
        function: "0x1::OracleNetwork::requestData",
        typeArguments: [],
        functionArguments: [dataType],
      },
    };

    try {
      const response = await signAndSubmitTransaction(transaction);
      setRequestId(response.hash);
      console.log("Request ID:", response.hash);
    } catch (error) {
      console.error("Error requesting data:", error);
    }
  }

  async function fetchData() {
    if (!account?.address || requestId === null) return;

    try {
      const result = await aptos.getAccountResource({
        accountAddress: account.address as AccountAddressInput,
        resourceType: "0x1::OracleNetwork::DataRequest",
      });

      setData(result.data as string);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  return (
    <div>
      <h2>Dashboard</h2>
      <div>
        <label>
          Data Type:
          <input
            type="text"
            value={dataType}
            onChange={(e) => setDataType(e.target.value)}
          />
        </label>
        <button onClick={requestData}>Request Data</button>
      </div>
      <div>
        <button onClick={fetchData}>Fetch Data</button>
        {data && <p>Data: {data}</p>}
      </div>
    </div>
  );
}

function StakeManagement() {
  const { signAndSubmitTransaction, account, connected } = useWallet();
  const [stakeAmount, setStakeAmount] = useState("");
  const [currentStake, setCurrentStake] = useState<string | null>(null);

  React.useEffect(() => {
    if (connected && account) {
      fetchCurrentStake();
    }
  }, [connected, account]);

  async function fetchCurrentStake() {
    if (!account) return;

    try {
      const result = await aptos.getAccountResource({
        accountAddress: account.address as AccountAddressInput,
        resourceType: "0x1::OracleNetwork::ValidatorStake",
      });
      setCurrentStake(result.data.amount as string);
    } catch (error) {
      console.error("Error fetching current stake:", error);
    }
  }

  async function stake() {
    if (!connected || !account) {
      alert("Please connect your wallet first.");
      return;
    }

    const transaction: InputTransactionData = {
      data: {
        function: "0x1::OracleNetwork::stake",
        typeArguments: [],
        functionArguments: [stakeAmount],
      },
    };

    try {
      await signAndSubmitTransaction(transaction);
      alert("Staking successful!");
      fetchCurrentStake();
    } catch (error) {
      console.error("Error staking:", error);
    }
  }

  return (
    <div>
      <h2>Stake Management</h2>
      {currentStake !== null && <p>Current Stake: {currentStake}</p>}
      <div>
        <label>
          Stake Amount:
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
          />
        </label>
        <button onClick={stake}>Stake</button>
      </div>
    </div>
  );
}

function DeveloperPortal() {
  const { account, connected } = useWallet();
  const [apiKey, setApiKey] = useState<string | null>(null);

  async function generateAPIKey() {
    if (!connected) {
      alert("Please connect your wallet first.");
      return;
    }

    // This is a placeholder. In a real application, you would call your backend to generate an API key.
    const newApiKey = `DEV-${Math.random().toString(36).substr(2, 9)}`;
    setApiKey(newApiKey);
  }

  return (
    <div>
      <h2>Developer Portal</h2>
      {connected ? (
        <div>
          {account && <p>Welcome, developer! Your address: {account.address}</p>}
          <button onClick={generateAPIKey}>Generate API Key</button>
          {apiKey && <p>Your API Key: {apiKey}</p>}
          <h3>API Documentation</h3>
          <p>Here you can add your API documentation, endpoints, and usage examples.</p>
        </div>
      ) : (
        <p>Please connect your wallet to access the developer portal.</p>
      )}
    </div>
  );
}

export default App;