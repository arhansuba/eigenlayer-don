module Randomness {
    use std::signer;
    use std::vector;
    use std::bcs;
    use std::hash;
    use aptos_std::timestamp;
    use aptos_framework::block;
    use aptos_std::ed25519;

     struct VRFProof {
        public_input: vector<u8>,
        output: vector<u8>,
        signature: vector<u8>,
    }

    struct VRFKey {
        public_key: vector<u8>,
        secret_key: vector<u8>,
    }

    public fun initialize(admin: &signer) {
        let (public_key, secret_key) = ed25519::generate_keys();
        let vrf_key = VRFKey {
            public_key,
            secret_key,
        };
        let generator = RandomGenerator {
            request_counter: 0,
            requests: table::new<u64, RandomRequest>(),
        };
        move_to(admin, generator);
        move_to(admin, vrf_key);
    } 

    struct RandomRequest {
        id: u64,
        requester: address,
        seed: u64,
        completed: bool,
        random_value: u64,
    }

    struct RandomGenerator {
        request_counter: u64,
        requests: table::Table<u64, RandomRequest>,
    }

    event RandomRequestCreated {
        id: u64,
        requester: address,
        seed: u64,
    }

    event RandomValueGenerated {
        id: u64,
        requester: address,
        random_value: u64,
    }

    const ERR_REQUEST_NOT_FOUND: u64 = 1;
    const ERR_REQUEST_ALREADY_COMPLETED: u64 = 2;

     const ENTROPY_SIZE: u64 = 32; // 256 bits of entropy

    fun generate_random(seed: u64, request_id: u64): vector<u8> {
        let entropy = vector::empty<u8>();
        
        // Combine multiple sources of entropy
        vector::append(&mut entropy, bcs::to_bytes(&seed));
        vector::append(&mut entropy, bcs::to_bytes(&request_id));
        vector::append(&mut entropy, bcs::to_bytes(&timestamp::now_microseconds()));
        vector::append(&mut entropy, bcs::to_bytes(&block::get_current_block_height()));
        
        // Use SHA3-256 for hashing
        let hashed_entropy = hash::sha3_256(entropy);
        
        // Ensure we have 256 bits of entropy
        while (vector::length(&hashed_entropy) < ENTROPY_SIZE) {
            vector::push_back(&mut hashed_entropy, 0);
        };
        
        hashed_entropy
    }
     public fun initialize(admin: &signer) {
        let (public_key, secret_key) = ed25519::generate_keys();
        let vrf_key = VRFKey {
            public_key,
            secret_key,
        };
        let generator = RandomGenerator {
            request_counter: 0,
            requests: table::new<u64, RandomRequest>(),
        };
        move_to(admin, generator);
        move_to(admin, vrf_key);
    }

    public fun generate_random_value(validator: &signer, request_id: u64) acquires RandomGenerator, VRFKey {
        let generator = borrow_global_mut<RandomGenerator>(signer::address_of(validator));
        let request = table::borrow_mut(&mut generator.requests, request_id);
        let vrf_key = borrow_global<VRFKey>(signer::address_of(validator));

        // Ensure the request is valid and not completed
        assert!(option::is_some(&option::borrow(&request)), ERR_REQUEST_NOT_FOUND);
        assert!(!request.completed, ERR_REQUEST_ALREADY_COMPLETED);

        let public_input = generate_public_input(request.seed, request_id);
        let (random_value, proof) = vrf_generate(&vrf_key, &public_input);

        request.random_value = vector_to_u64(&random_value);
        request.completed = true;
        request.vrf_proof = Some(proof);

        event::emit<RandomValueGenerated>(&RandomValueGenerated { id: request.id, requester: request.requester, random_value: request.random_value });
    }

    fun generate_public_input(seed: u64, request_id: u64): vector<u8> {
        let input = vector::empty<u8>();
        vector::append(&mut input, bcs::to_bytes(&seed));
        vector::append(&mut input, bcs::to_bytes(&request_id));
        vector::append(&mut input, bcs::to_bytes(&timestamp::now_microseconds()));
        vector::append(&mut input, bcs::to_bytes(&block::get_current_block_height()));
        input
    }

    fun vrf_generate(vrf_key: &VRFKey, public_input: &vector<u8>): (vector<u8>, VRFProof) {
        let to_sign = hash::sha3_256(*public_input);
        let signature = ed25519::sign_internal(&vrf_key.secret_key, to_sign);
        let output = hash::sha3_256(signature);
        
        let proof = VRFProof {
            public_input: *public_input,
            output: output,
            signature,
        };
        
        (output, proof)
    }

    public fun verify_vrf(public_key: &vector<u8>, proof: &VRFProof): bool {
        let to_sign = hash::sha3_256(proof.public_input);
        let valid_signature = ed25519::verify_internal(&proof.signature, public_key, &to_sign);
        let computed_output = hash::sha3_256(proof.signature);
        
        valid_signature && computed_output == proof.output
    }

    public fun generate_random_value(validator: &signer, request_id: u64) acquires RandomGenerator {
        let generator = borrow_global_mut<RandomGenerator>(signer::address_of(validator));
        let request = table::borrow_mut(&mut generator.requests, request_id);

        // Ensure the request is valid and not completed
        assert!(option::is_some(&option::borrow(&request)), ERR_REQUEST_NOT_FOUND);
        assert!(!request.completed, ERR_REQUEST_ALREADY_COMPLETED);

        let random_bytes = generate_random(request.seed, request_id);
        let random_value = vector_to_u64(&random_bytes);

        request.random_value = random_value;
        request.completed = true;

        event::emit<RandomValueGenerated>(&RandomValueGenerated { id: request.id, requester: request.requester, random_value });
    }

    fun vector_to_u64(v: &vector<u8>): u64 {
        let result = 0u64;
        let i = 0;
        while (i < 8 && i < vector::length(v)) {
            result = (result << 8) | (*vector::borrow(v, i) as u64);
            i = i + 1;
        };
        result
    }


    public fun initialize(admin: &signer) {
        let generator = RandomGenerator {
            request_counter: 0,
            requests: table::new<u64, RandomRequest>(),
        };
        move_to(admin, generator);
    }

    public fun create_random_request(requester: &signer, seed: u64): u64 {
        let generator = borrow_global_mut<RandomGenerator>(signer::address_of(requester));
        let id = generator.request_counter;
        let request = RandomRequest {
            id,
            requester: signer::address_of(requester),
            seed,
            completed: false,
            random_value: 0,
        };
        table::add(&mut generator.requests, id, request);
        generator.request_counter = id + 1;

        event::emit<RandomRequestCreated>(&RandomRequestCreated { id, requester: signer::address_of(requester), seed });
        id
    }

    public fun generate_random_value(validator: &signer, request_id: u64) {
        let generator = borrow_global_mut<RandomGenerator>(signer::address_of(validator));
        let request = table::borrow_mut(&mut generator.requests, request_id);

        // Ensure the request is valid and not completed
        assert!(option::is_some(&option::borrow(&request)), ERR_REQUEST_NOT_FOUND);
        assert!(!request.completed, ERR_REQUEST_ALREADY_COMPLETED);

        let seed = request.seed;
        let timestamp = 0; // Placeholder for actual timestamp retrieval
        let random_value = generate_random(seed, timestamp);

        request.random_value = random_value;
        request.completed = true;

        event::emit<RandomValueGenerated>(&RandomValueGenerated { id: request.id, requester: request.requester, random_value });
    }

    public fun get_random_request(requester: address, request_id: u64): &RandomRequest {
        let generator = borrow_global<RandomGenerator>(requester);
        table::borrow(&generator.requests, request_id)
    }

    public fun list_random_requests(): vector<RandomRequest> {
        let generator = borrow_global<RandomGenerator>(signer::address_of(generator));
        let mut requests = vector::empty<RandomRequest>();
        let keys = table::keys(&generator.requests);
        for key in keys {
            let request = table::borrow(&generator.requests, *key);
            vector::push_back(&mut requests, *request);
        }
        requests
    }

    // Internal function to generate a random number
    fun generate_random(seed: u64, timestamp: u64): u64 {
        let combined_value = seed + timestamp;
        let random_value = combined_value % 1000000; // Example range: 0 to 999999
        random_value
    }

    // Helper functions to save and borrow random requests
    fun save_request(id: u64, request: RandomRequest) {
        // Save the request in a global storage map (omitted for brevity)
    }

    fun borrow_request(id: u64): &mut RandomRequest {
        // Borrow the request from the global storage map (omitted for brevity)
    }

    fun generate_id(): u64 {
        // Generate a unique ID (omitted for brevity)
    }
}
