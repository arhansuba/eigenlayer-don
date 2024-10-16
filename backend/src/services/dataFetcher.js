const axios = require('axios');
const NodeCache = require('node-cache');
const Joi = require('joi');
const { mean, standardDeviation } = require('simple-statistics');

// Initialize cache
const cache = new NodeCache({ stdTTL: 300, checkperiod: 120 });

class DataSource {
  constructor(name, url, schema, parseFunction) {
    this.name = name;
    this.url = url;
    this.schema = schema;
    this.parseFunction = parseFunction;
    this.reliability = 1.0;
    this.successfulFetches = 0;
    this.totalFetches = 0;
  }

  updateReliability() {
    this.reliability = this.successfulFetches / this.totalFetches;
  }
}

class DataFetcher {
  constructor() {
    this.dataSources = {};
  }

  addDataSource(name, url, schema, parseFunction) {
    this.dataSources[name] = new DataSource(name, url, schema, parseFunction);
  }

  async fetchData(sourceName, options = {}) {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      useCache = true,
      cacheTTL = 300
    } = options;

    const source = this.dataSources[sourceName];
    if (!source) {
      throw new Error(`Data source ${sourceName} not found`);
    }

    const cacheKey = `${sourceName}:${source.url}`;

    if (useCache) {
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log(`Using cached data for ${sourceName}`);
        return cachedData;
      }
    }

    let retries = 0;
    source.totalFetches++;

    while (retries < maxRetries) {
      try {
        const response = await axios.get(source.url);
        const parsedData = source.parseFunction(response.data);
        
        const { error, value } = source.schema.validate(parsedData);
        if (error) {
          throw new Error(`Data validation failed: ${error.message}`);
        }

        const sanitizedData = this.sanitizeData(value);
        const normalizedData = this.normalizeData(sanitizedData);

        source.successfulFetches++;
        source.updateReliability();

        if (useCache) {
          cache.set(cacheKey, normalizedData, cacheTTL);
        }

        return normalizedData;
      } catch (error) {
        console.error(`Error fetching data from ${sourceName}:`, error.message);
        retries++;
        await this.wait(retryDelay * retries);
      }
    }

    console.error(`Failed to fetch data from ${sourceName} after ${maxRetries} retries`);
    source.updateReliability();
    return null;
  }

  async fetchAllData(options = {}) {
    const results = {};
    for (const [name, source] of Object.entries(this.dataSources)) {
      results[name] = await this.fetchData(name, options);
    }
    return results;
  }

  getSourceReliability(sourceName) {
    const source = this.dataSources[sourceName];
    if (!source) {
      throw new Error(`Data source ${sourceName} not found`);
    }
    return source.reliability;
  }

  sanitizeData(data) {
    // Implement data sanitization logic here
    // This is a simple example; expand based on your specific needs
    if (typeof data === 'object' && data !== null) {
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'string') {
          data[key] = data[key].trim();
        }
      });
    }
    return data;
  }

  normalizeData(data) {
    // Implement data normalization logic here
    // This is a simple example; expand based on your specific needs
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'number') {
      const avg = mean(data);
      const stdDev = standardDeviation(data);
      return data.map(value => (value - avg) / stdDev);
    }
    return data;
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Example usage
const dataFetcher = new DataFetcher();

// Add data sources
dataFetcher.addDataSource(
  'cryptoPrice',
  'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
  Joi.object({
    ethereum: Joi.object({
      usd: Joi.number().positive().required()
    }).required()
  }),
  (data) => data.ethereum.usd
);

dataFetcher.addDataSource(
  'weatherData',
  'https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY',
  Joi.object({
    main: Joi.object({
      temp: Joi.number().required()
    }).required()
  }),
  (data) => data.main.temp
);

async function fetchAndProcessData() {
  try {
    const allData = await dataFetcher.fetchAllData();
    console.log('Fetched data:', allData);

    const cryptoReliability = dataFetcher.getSourceReliability('cryptoPrice');
    const weatherReliability = dataFetcher.getSourceReliability('weatherData');

    console.log('Data source reliability:');
    console.log('Crypto Price:', cryptoReliability);
    console.log('Weather Data:', weatherReliability);

    return allData;
  } catch (error) {
    console.error('Error fetching and processing data:', error);
  }
}

module.exports = { DataFetcher, fetchAndProcessData };