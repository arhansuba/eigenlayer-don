const { ethers } = require('ethers');
const { EventEmitter } = require('events');
const winston = require('winston');
const NodeCache = require('node-cache');
const { v4: uuidv4 } = require('uuid');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'validator-coordinator.log' })
  ]
});

class ValidatorCoordinator extends EventEmitter {
  constructor(provider, eigenLayerOracleAddress, stakingManagerAddress) {
    super();
    this.provider = new ethers.providers.JsonRpcProvider(provider);
    this.eigenLayerOracle = new ethers.Contract(eigenLayerOracleAddress, EIGENLAYER_ORACLE_ABI, this.provider);
    this.stakingManager = new ethers.Contract(stakingManagerAddress, STAKING_MANAGER_ABI, this.provider);
    this.validators = new Map();
    this.currentLeader = null;
    this.roundNumber = 0;
    this.cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
  }

  async initialize() {
    await this.loadValidators();
    this.startLeaderElection();
    this.startPerformanceTracking();
  }

  async loadValidators() {
    // Fetch validators from the StakingManager contract
    const validatorAddresses = await this.stakingManager.getValidators();
    for (const address of validatorAddresses) {
      const stake = await this.stakingManager.getValidatorStake(address);
      this.validators.set(address, {
        address,
        stake,
        lastActive: Date.now(),
        successfulSubmissions: 0,
        totalSubmissions: 0,
        performance: 1.0
      });
    }
    logger.info(`Loaded ${this.validators.size} validators`);
  }

  startLeaderElection() {
    setInterval(() => {
      this.electLeader();
    }, 60000); // Run leader election every minute
  }

  electLeader() {
    this.roundNumber++;
    const activeValidators = Array.from(this.validators.values()).filter(v => this.isValidatorActive(v));
    if (activeValidators.length === 0) {
      logger.warn('No active validators available for leader election');
      return;
    }

    // Simple stake-weighted random selection
    const totalStake = activeValidators.reduce((sum, v) => sum + v.stake, 0);
    let randomPoint = Math.floor(Math.random() * totalStake);
    let leader = activeValidators[0];

    for (const validator of activeValidators) {
      if (randomPoint < validator.stake) {
        leader = validator;
        break;
      }
      randomPoint -= validator.stake;
    }

    this.currentLeader = leader;
    logger.info(`New leader elected for round ${this.roundNumber}`, { leader: leader.address });
    this.emit('newLeader', { round: this.roundNumber, leader: leader.address });
  }

  isValidatorActive(validator) {
    const inactivityThreshold = 10 * 60 * 1000; // 10 minutes
    return Date.now() - validator.lastActive < inactivityThreshold;
  }

  startPerformanceTracking() {
    setInterval(() => {
      this.updateValidatorPerformance();
    }, 300000); // Update performance every 5 minutes
  }

  updateValidatorPerformance() {
    for (const [address, validator] of this.validators) {
      if (validator.totalSubmissions > 0) {
        validator.performance = validator.successfulSubmissions / validator.totalSubmissions;
      }
      logger.info(`Updated performance for validator ${address}`, { 
        performance: validator.performance,
        successfulSubmissions: validator.successfulSubmissions,
        totalSubmissions: validator.totalSubmissions
      });
    }
  }

  async submitData(validatorAddress, requestId, data) {
    const validator = this.validators.get(validatorAddress);
    if (!validator) {
      throw new Error('Validator not registered');
    }

    validator.lastActive = Date.now();
    validator.totalSubmissions++;

    try {
      await this.eigenLayerOracle.submitData(requestId, data, { from: validatorAddress });
      validator.successfulSubmissions++;
      logger.info(`Validator ${validatorAddress} successfully submitted data for request ${requestId}`);
      return true;
    } catch (error) {
      logger.error(`Error submitting data for validator ${validatorAddress}`, { error: error.message });
      return false;
    }
  }

  getValidatorPerformance(validatorAddress) {
    const validator = this.validators.get(validatorAddress);
    if (!validator) {
      throw new Error('Validator not found');
    }
    return {
      address: validator.address,
      stake: validator.stake,
      performance: validator.performance,
      successfulSubmissions: validator.successfulSubmissions,
      totalSubmissions: validator.totalSubmissions
    };
  }

  getAllValidatorPerformances() {
    return Array.from(this.validators.values()).map(v => ({
      address: v.address,
      stake: v.stake,
      performance: v.performance,
      successfulSubmissions: v.successfulSubmissions,
      totalSubmissions: v.totalSubmissions
    }));
  }

  getCurrentLeader() {
    return this.currentLeader ? this.currentLeader.address : null;
  }

  async createConsensusRound(dataRequest) {
    const roundId = uuidv4();
    const leader = this.getCurrentLeader();
    if (!leader) {
      throw new Error('No leader available to start consensus round');
    }

    const round = {
      id: roundId,
      dataRequest,
      leader,
      participants: Array.from(this.validators.keys()),
      submissions: new Map(),
      status: 'ACTIVE',
      startTime: Date.now()
    };

    this.cache.set(`round:${roundId}`, round);
    logger.info(`Created new consensus round`, { roundId, leader, dataRequest });
    this.emit('newConsensusRound', { roundId, leader, dataRequest });
    return roundId;
  }

  async submitConsensusData(roundId, validatorAddress, data) {
    const round = this.cache.get(`round:${roundId}`);
    if (!round || round.status !== 'ACTIVE') {
      throw new Error('Invalid or inactive consensus round');
    }

    round.submissions.set(validatorAddress, data);
    logger.info(`Received consensus submission`, { roundId, validatorAddress });

    if (round.submissions.size === round.participants.length) {
      await this.finalizeConsensusRound(roundId);
    }
  }

  async finalizeConsensusRound(roundId) {
    const round = this.cache.get(`round:${roundId}`);
    if (!round || round.status !== 'ACTIVE') {
      throw new Error('Invalid or inactive consensus round');
    }

    // Simple majority consensus
    const valueCounts = new Map();
    let maxCount = 0;
    let consensusValue;

    for (const [validator, value] of round.submissions) {
      const count = (valueCounts.get(value) || 0) + 1;
      valueCounts.set(value, count);
      if (count > maxCount) {
        maxCount = count;
        consensusValue = value;
      }
    }

    round.status = 'FINALIZED';
    round.consensusValue = consensusValue;
    round.endTime = Date.now();

    logger.info(`Finalized consensus round`, { roundId, consensusValue });
    this.emit('consensusReached', { roundId, consensusValue });

    // Update validator performances based on consensus participation
    for (const [validator, value] of round.submissions) {
      const validatorData = this.validators.get(validator);
      validatorData.totalSubmissions++;
      if (value === consensusValue) {
        validatorData.successfulSubmissions++;
      }
    }

    return consensusValue;
  }
}

module.exports = ValidatorCoordinator;