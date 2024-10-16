import { BlockchainAdapter } from './interfaces/BlockchainAdapter';
import { EthereumAdapter } from './adapters/EthereumAdapter';


export class OracleManager {
  private adapters: Map<string, BlockchainAdapter> = new Map();

  constructor() {
    const ethereumRpcUrl = process.env.ETHEREUM_RPC_URL;
    if (!ethereumRpcUrl) {
      throw new Error('ETHEREUM_RPC_URL is not defined');
    }
    this.adapters.set('ethereum', new EthereumAdapter(ethereumRpcUrl));
    
  }

  async submitDataToChain(chain: string, oracleAddress: string, data: any) {
    const adapter = this.adapters.get(chain);
    if (!adapter) {
      throw new Error(`Unsupported blockchain: ${chain}`);
    }

    return adapter.callContract(oracleAddress, 'submitData', [data]);
  }

  subscribeToDataRequests(chain: string, oracleAddress: string, callback: (event: any) => void) {
    const adapter = this.adapters.get(chain);
    if (!adapter) {
      throw new Error(`Unsupported blockchain: ${chain}`);
    }

    adapter.subscribeToEvents(oracleAddress, 'DataRequested', callback);
  }
}

// Usage
const oracleManager = new OracleManager();
oracleManager.submitDataToChain('ethereum', '0x...', { price: 1000 });
oracleManager.subscribeToDataRequests('eth', '0x...', (event) => {
  console.log('New data request on eth:', event);
});