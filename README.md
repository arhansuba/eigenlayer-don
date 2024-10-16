# Decentralized Oracle Network (DON) Project

## Project Concept

The Decentralized Oracle Network (DON) is designed to provide secure, reliable, and tamper-proof data feeds for smart contracts on Ethereum and other blockchains. By leveraging EigenLayer's restaking capabilities and Movement Labs' SDK, DON enhances security and facilitates seamless integration across different blockchain ecosystems.

## Overview

DON ensures data accuracy through distributed validation, aggregates data using consensus mechanisms, and secures the network through restaking mechanisms and slashing conditions for validators. This multi-layered approach guarantees the integrity and reliability of the oracle network.

## Key Features

### Distributed Validation
- Validators verify data from multiple sources to ensure accuracy.
- Consensus mechanisms finalize validated data for use in smart contracts.

### Restaking for Security
- Validators restake tokens to participate in the network, enhancing overall security.
- Slashing conditions deter malicious or faulty validators, maintaining network integrity.

### Integration with Movement SDK
- Utilizes Movement Labs' SDK for seamless integration with Ethereum and Layer 2 solutions.

### Data Feeds
- Provides diverse data feeds including price feeds, weather data, sports scores, and more.
- Secure APIs for developers to access data feeds for smart contract applications.

## Project Structure

### Smart Contracts
- Manages data submission, validation, aggregation, and distribution.
- Implements restaking contracts for managing validator stakes and slashing conditions.

### Backend Services
- Collects data from multiple sources.
- Validates data through the oracle network.
- Submits verified data to smart contracts.
- Coordinates validators and implements consensus mechanisms.

### Frontend Interface
- User-friendly interface for accessing data feeds.
- Validator tools for managing stakes and participation in data validation.
- Developer tools for integration with the oracle network.

## Getting Started

Follow these steps to set up and run the Decentralized Oracle Network (DON) project locally:

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Git
- Ethereum wallet (e.g., MetaMask)
- Access to an Ethereum node (e.g., Infura endpoint)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/decentralized-oracle-network.git
   cd decentralized-oracle-network
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```
   ETHEREUM_RPC_URL=your_ethereum_node_url
   PRIVATE_KEY=your_ethereum_wallet_private_key
   ```

4. Compile smart contracts:
   ```
   npm run compile
   ```

5. Deploy smart contracts:
   ```
   npm run deploy
   ```

6. Start the backend service:
   ```
   npm run start:backend
   ```

7. In a new terminal, start the frontend application:
   ```
   npm run start:frontend
   ```

The application should now be running on `http://localhost:3000`.

## Usage

Here are some examples of how to use the Decentralized Oracle Network in various scenarios:

### 1. Fetching Data from DON

To fetch data from the DON in your smart contract:

```solidity
pragma solidity ^0.8.0;

import "@don/contracts/interfaces/IDONConsumer.sol";

contract MyContract is IDONConsumer {
    address private donAddress;
    
    constructor(address _donAddress) {
        donAddress = _donAddress;
    }
    
    function requestData(string memory dataType) external {
        IDON(donAddress).requestData(dataType);
    }
    
    function fulfillData(uint256 requestId, bytes memory result) external override {
        // Handle the received data
        // This function will be called by the DON when data is ready
    }
}
```

### 2. Becoming a Validator

To participate as a validator:

1. Stake tokens:
   ```javascript
   const don = await DON.at(donAddress);
   await don.stake(web3.utils.toWei('1000', 'ether'));
   ```

2. Run the validator node:
   ```
   npm run validator -- --key your_validator_key
   ```

### 3. Integrating DON Data Feeds in a DApp

In your frontend application:

```javascript
import { DONProvider, useDONData } from '@don/react-sdk';

function PriceFeed() {
  const { data, loading, error } = useDONData('ETH/USD');

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return <p>ETH Price: ${data.price}</p>;
}

function App() {
  return (
    <DONProvider network="mainnet">
      <PriceFeed />
    </DONProvider>
  );
}
```

### 4. Submitting New Data Sources

To submit a new data source for consideration:

```javascript
const don = await DON.at(donAddress);
await don.proposeDataSource('New Weather API', 'https://api.weather.com', 'hourly');
```

### 5. Accessing Developer Tools

Visit the developer portal at `http://localhost:3000/dev` to:
- Generate API keys
- View documentation
- Test API endpoints
- Monitor network statistics

Remember to always use the latest version of the DON SDK and refer to the official documentation for the most up-to-date usage instructions and best practices.

## Contributing

We welcome contributions to the Decentralized Oracle Network project. Please read our contributing guidelines before submitting pull requests.



## Contact

For questions and support, please contact (provide contact information or links to community channels).

---

This project is part of the ongoing efforts to improve blockchain interoperability and data reliability in the Web3 ecosystem.