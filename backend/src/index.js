const { Aptos, AptosConfig, Network } = require("@aptos-labs/ts-sdk");
const dotenv = require('dotenv');
const winston = require('winston');
const fetchData = require('./services/dataFetcher');
const { submitData } = require('./services/contractInteractor');

// Load environment variables from .env file
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
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Initialize Aptos SDK with custom network configuration
const aptosConfig = new AptosConfig({ 
  network: Network.CUSTOM,
  // Add other necessary configurations
  fullnode: process.env.APTOS_FULLNODE_URL,
  // You might need to add more configuration options here
});
const aptos = new Aptos(aptosConfig);

// Define data sources
const dataSources = [
  { name: "example", url: "https://api.example.com/data" },
  // Add more data sources as needed
];

// Main function to fetch and submit data
async function processDataSources() {
  for (const source of dataSources) {
    try {
      logger.info(`Fetching data from ${source.name}`);
      const data = await fetchData(source.url);
      if (data) {
        logger.info(`Submitting data from ${source.name} to contract`);
        const requestId = await getRequestId(source.name); // Implement this function
        await submitDataToContract(requestId, data);
      }
    } catch (error) {
      logger.error(`Error processing ${source.name}:`, error);
    }
  }
}

// Function to submit data to the smart contract
async function submitDataToContract(requestId, data) {
  try {
    const response = await submitData(aptos, requestId, data);
    logger.info(`Transaction submitted. Hash: ${response.hash}`);
    return response;
  } catch (error) {
    logger.error("Error submitting data to contract:", error);
    throw error;
  }
}

// Function to get request ID (you need to implement this based on your contract logic)
async function getRequestId(sourceName) {
  // Implement logic to get or generate request ID
  // This might involve interacting with your smart contract
  return 1; // Placeholder
}

// Schedule the main function to run periodically
function scheduleDataProcessing(intervalMinutes) {
  setInterval(processDataSources, intervalMinutes * 60 * 1000);
}

// Start the application
async function startApplication() {
  try {
    logger.info("Starting Oracle Network backend");
    await processDataSources(); // Run once immediately
    scheduleDataProcessing(5); // Then schedule to run every 5 minutes
  } catch (error) {
    logger.error("Error starting application:", error);
    process.exit(1);
  }
}

// Execute start function
startApplication();

module.exports = { processDataSources, submitDataToContract };