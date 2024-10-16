module EigenLayerOracle {
    use StakingManager;
    use std::signer;
    use std::vector;
    use std::string;
    use std::option;
    use std::error;
    use std::event;
    use std::table;

    const ERR_REQUEST_NOT_FOUND: u64 = 1;
    const ERR_REQUEST_ALREADY_COMPLETED: u64 = 2;
    const ERR_VALIDATOR_NOT_FOUND: u64 = 3;
    const ERR_INSUFFICIENT_STAKE: u64 = 4;
    const ERR_UNAUTHORIZED_ACCESS: u64 = 5;
      const SLASHING_THRESHOLD: u64 = 10; // 10% deviation from consensus
    const SLASHING_PENALTY: u64 = 5; // 5% of stake


     struct DataSubmission {
        validator: address,
        data: string::String,
        timestamp: u64,
    }

    struct DataRequest {
        id: u64,
        data_type: string::String,
        requester: address,
        completed: bool,
        aggregated_data: string::String,
        submissions: vector<DataSubmission>,
        min_submissions: u64,
    }

    struct Validator {
        id: u64,
        validator_address: address,
        stake: u64,
    }

    struct DataRequestHistory {
        requests: vector<DataRequest>,
    }

    resource struct Oracle {
        request_counter: u64,
        requests: table::Table<u64, DataRequest>,
        validators: table::Table<address, Validator>,
    }

    event RequestCreated {
        id: u64,
        data_type: string::String,
        requester: address,
    }

    event DataSubmitted {
        request_id: u64,
        validator: address,
        data: string::String,
    }
     
     public fun register_validator(admin: &signer, validator_address: address) {
        let oracle = borrow_global_mut<Oracle>(signer::address_of(admin));
        assert!(StakingManager::is_validator(validator_address), ERR_INSUFFICIENT_STAKE);
        
        let validator = Validator {
            id: table::length(&oracle.validators),
            validator_address,
        };
        table::add(&mut oracle.validators, validator_address, validator);
    }
     public fun slash_deviant_validators(admin: &signer, request_id: u64) acquires Oracle {
        let oracle = borrow_global_mut<Oracle>(signer::address_of(admin));
        let request = table::borrow(&oracle.requests, request_id);

        assert!(request.completed, ERR_REQUEST_NOT_COMPLETED);

        let consensus_value = string::to_integer(&request.aggregated_data);
        
        vector::for_each(&request.submissions, |submission| {
            let submitted_value = string::to_integer(&submission.data);
            let deviation = abs_difference(submitted_value, consensus_value);
            
            if (deviation > (consensus_value * SLASHING_THRESHOLD) / 100) {
                let validator = table::borrow_mut(&mut oracle.validators, submission.validator);
                let slash_amount = (validator.stake * SLASHING_PENALTY) / 100;
                validator.stake = validator.stake - slash_amount;
                
                event::emit<ValidatorSlashed>(&ValidatorSlashed { 
                    validator: submission.validator, 
                    amount: slash_amount,
                    request_id 
                });
            }
        });
    }

    fun abs_difference(a: u64, b: u64): u64 {
        if (a > b) { a - b } else { b - a }
    }

    struct ValidatorSlashed {
        validator: address,
        amount: u64,
        request_id: u64,
    }

    public fun request_data(requester: &signer, data_type: string::String, min_submissions: u64): u64 {
        let oracle = borrow_global_mut<Oracle>(signer::address_of(requester));
        let id = oracle.request_counter;
        let request = DataRequest {
            id,
            data_type: data_type.clone(),
            requester: signer::address_of(requester),
            completed: false,
            aggregated_data: string::String::empty(),
            submissions: vector::empty<DataSubmission>(),
            min_submissions,
        };
        table::add(&mut oracle.requests, id, request);
        oracle.request_counter = id + 1;
        event::emit<RequestCreated>(&RequestCreated { id, data_type, requester: signer::address_of(requester) });
        id
    }

    public fun submit_data(validator: &signer, request_id: u64, data: string::String) {
        let oracle = borrow_global_mut<Oracle>(signer::address_of(validator));
        let validator_address = signer::address_of(validator);
        let request = table::borrow_mut(&mut oracle.requests, request_id);


    public fun initialize(admin: &signer) {
        let oracle = Oracle {
            request_counter: 0,
            requests: table::new<u64, DataRequest>(),
            validators: table::new<address, Validator>(),
        };
        move_to(admin, oracle);
    }

    public fun register_validator(admin: &signer, validator_address: address, stake: u64) {
        let oracle = borrow_global_mut<Oracle>(signer::address_of(admin));
        let validator = Validator {
            id: oracle.validators.size(),
            validator_address,
            stake,
        };
        table::add(&mut oracle.validators, validator_address, validator);
    }

    public fun request_data(requester: &signer, data_type: string::String): u64 {
        let oracle = borrow_global_mut<Oracle>(signer::address_of(requester));
        let id = oracle.request_counter;
        let request = DataRequest {
            id,
            data_type: data_type.clone(),
            requester: signer::address_of(requester),
            completed: false,
            data: string::String::empty(),
            validators: vector::empty<address>(),
        };
        table::add(&mut oracle.requests, id, request);
        oracle.request_counter = id + 1;
        event::emit<RequestCreated>(&RequestCreated { id, data_type, requester: signer::address_of(requester) });
        id
    }

    public fun submit_data(validator: &signer, request_id: u64, data: string::String) {
        let oracle = borrow_global_mut<Oracle>(signer::address_of(validator));
        let validator_address = signer::address_of(validator);
        let request = table::borrow_mut(&mut oracle.requests, request_id);

         let submission = DataSubmission {
            validator: validator_address,
            data: data.clone(),
            timestamp: timestamp::now_seconds(),
        };
        vector::push_back(&mut request.submissions, submission);

        // Check if we have enough submissions to aggregate
       if (vector::length(&request.submissions) >= request.min_submissions) {
            let consensus_reached = calculate_consensus(oracle, request);
            if (consensus_reached) {
                request.completed = true;
            }
        }
        event::emit<DataSubmitted>(&DataSubmitted { request_id, validator: validator_address, data });
    }
    fun calculate_consensus(oracle: &Oracle, request: &mut DataRequest): bool {
        let total_stake = 0u64;
        let data_votes = table::new<string::String, u64>();

        vector::for_each(&request.submissions, |submission| {
            let validator = table::borrow(&oracle.validators, submission.validator);
            let stake = validator.stake;
            total_stake = total_stake + stake;

            let current_votes = table::borrow_mut_with_default(&mut data_votes, submission.data, 0u64);
            *current_votes = *current_votes + stake;
        });

        let threshold = (total_stake * 2) / 3; // 2/3 majority
        let consensus_data = string::String::empty();
        let max_votes = 0u64;

        table::for_each(&data_votes, |data, votes| {
            if (*votes > max_votes && *votes >= threshold) {
                consensus_data = data;
                max_votes = *votes;
            }
        });

        if (!string::is_empty(&consensus_data)) {
            request.aggregated_data = consensus_data;
            true
        } else {
            false
        }
    }

    fun aggregate_data(submissions: &vector<DataSubmission>): string::String {
        // Implement your aggregation logic here
        // For example, you could take the median or mode of the submissions
        // This is a placeholder implementation
        if (vector::is_empty(submissions)) {
            return string::String::empty()
        }
        vector::borrow(submissions, 0).data
    }
    }

    public fun get_request(requester: address, request_id: u64): &DataRequest {
        let oracle = borrow_global<Oracle>(requester);
        table::borrow(&oracle.requests, request_id)
    }

    public fun get_validator(validator_address: address): &Validator {
        let oracle = borrow_global<Oracle>(validator_address);
        table::borrow(&oracle.validators, validator_address)
    }

    public fun list_requests(): vector<DataRequest> {
        let oracle = borrow_global<Oracle>(signer::address_of(oracle));
        let mut requests = vector::empty<DataRequest>();
        let keys = table::keys(&oracle.requests);
        for key in keys {
            let request = table::borrow(&oracle.requests, *key);
            vector::push_back(&mut requests, *request);
        }
        requests
    }

    // Helper functions to save and borrow data requests
    fun save_request(id: u64, request: DataRequest) {
        // Save the request in a global storage map (omitted for brevity)
    }

    fun borrow_request(id: u64): &mut DataRequest {
        // Borrow the request from the global storage map (omitted for brevity)
    }

    fun generate_id(): u64 {
        // Generate a unique ID (omitted for brevity)
    }
}
