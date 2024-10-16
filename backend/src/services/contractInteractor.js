const { Aptos, AptosConfig, NetworkName } = require("@aptos-labs/ts-sdk");
const dotenv = require('dotenv');
const NodeCache = require('node-cache');
const asyncRetry = require('async-retry');
const winston = require('winston');

dotenv.config();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'contract-interactor.log' })
  ]
});

// Initialize cache
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

// Initialize Aptos instance with configuration
const aptosConfig = new AptosConfig({
  network: NetworkName.MAINNET, // or NetworkName.TESTNET
  // Add other necessary configurations
});
const aptos = new Aptos(aptosConfig);

/**
 * Function to submit data to the blockchain with retries and caching
 * @param {string} requestId - The ID of the data request
 * @param {string} data - The data to be submitted
 */
async function submitData(requestId, data) {
  const cacheKey = `submit:${requestId}:${data}`;
  const cachedResult = cache.get(cacheKey);

  if (cachedResult) {
    logger.info(`Using cached result for request ${requestId}`);
    return cachedResult;
  }

  const transaction = {
    data: {
      function: "OracleNetwork::submitData",
      functionArguments: [requestId, data],
    },
  };

  try {
    const result = await asyncRetry(
      async (bail) => {
        try {
          logger.info(`Submitting data for request ${requestId}`);
          const response = await aptos.signAndSubmitTransaction(transaction);
          logger.info(`Transaction submitted. Hash: ${response.hash}`);

          await waitForTransactionConfirmation(response.hash);

          const eventListener = aptos.on("OracleNetwork::DataSubmitted", (event) => {
            logger.info("Data submitted event received:", event);
            // Process event data here if needed
          });

          // Clean up listener after a certain time or condition
          setTimeout(() => {
            aptos.off("OracleNetwork::DataSubmitted", eventListener);
          }, 60000); // Listen for 1 minute

          cache.set(cacheKey, response);
          return response;
        } catch (error) {
          logger.error(`Error submitting data for request ${requestId}:`, error);
          if (error.message.includes('insufficient funds')) {
            bail(error); // Don't retry if it's a funds issue
            return;
          }
          throw error;
        }
      },
      {
        retries: 5,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 60000,
        randomize: true,
        onRetry: (error, attempt) => {
          logger.warn(`Retrying submit for request ${requestId} (attempt ${attempt}):`, error);
        },
      }
    );

    return result;
  } catch (error) {
    logger.error(`Failed to submit data for request ${requestId} after retries:`, error);
    throw error;
  }
}

/**
 * Function to wait for transaction confirmation with timeout
 * @param {string} transactionHash - Hash of the submitted transaction
 */
async function waitForTransactionConfirmation(transactionHash) {
  const startTime = Date.now();
  const timeout = 300000; // 5 minutes timeout

  while (Date.now() - startTime < timeout) {
    try {
      const receipt = await aptos.waitForTransaction({ transactionHash });
      logger.info(`Transaction confirmed at block ${receipt.blockNumber}`);
      return receipt;
    } catch (error) {
      logger.warn(`Waiting for transaction ${transactionHash} confirmation:`, error);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
    }
  }

  throw new Error(`Transaction ${transactionHash} confirmation timeout`);
}

/**
 * Function to get the current gas price
 * @returns {Promise<string>} The current gas price
 */
async function getGasPrice() {
  try {
    const gasPrice = await aptos.getGasPrice();
    logger.info(`Current gas price: ${gasPrice}`);
    return gasPrice;
  } catch (error) {
    logger.error('Error fetching gas price:', error);
    throw error;
  }
}

/**
 * Function to estimate gas for a transaction
 * @param {Object} transaction - The transaction object
 * @returns {Promise<string>} The estimated gas
 */
async function estimateGas(transaction) {
  try {
    const estimatedGas = await aptos.estimateGasForTransaction(transaction);
    logger.info(`Estimated gas: ${estimatedGas}`);
    return estimatedGas;
  } catch (error) {
    logger.error('Error estimating gas:', error);
    throw error;
  }
}

module.exports = {
  submitData,
  getGasPrice,
  estimateGas
};