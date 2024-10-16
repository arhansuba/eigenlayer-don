module StakingManager {
    use std::signer;
    use std::vector;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_std::event::{Self, EventHandle};
    use aptos_framework::timestamp;
    use aptos_std::table::{Self, Table};

    /// Errors
    const ERR_NOT_INITIALIZED: u64 = 1;
    const ERR_ALREADY_INITIALIZED: u64 = 2;
    const ERR_INSUFFICIENT_BALANCE: u64 = 3;
    const ERR_INSUFFICIENT_STAKE: u64 = 4;
    const ERR_COOLDOWN_PERIOD: u64 = 5;
    const ERR_NOT_AUTHORIZED: u64 = 6;

    /// Structs
    struct StakingPool has key {
        total_stake: u64,
        validators: Table<address, ValidatorStake>,
        stake_events: EventHandle<StakeEvent>,
        unstake_events: EventHandle<UnstakeEvent>,
        restake_events: EventHandle<RestakeEvent>,
    }

    struct ValidatorStake has store {
        amount: u64,
        last_stake_timestamp: u64,
        cooldown_end: u64,
    }

    /// Events
    struct StakeEvent has drop, store {
        validator: address,
        amount: u64,
    }

    struct UnstakeEvent has drop, store {
        validator: address,
        amount: u64,
    }

    struct RestakeEvent has drop, store {
        validator: address,
        amount: u64,
        target: address,
    }

    /// Constants
    const MINIMUM_STAKE: u64 = 1000000; // 1 APT
    const COOLDOWN_PERIOD: u64 = 86400; // 1 day in seconds

    /// Functions
    public fun initialize(admin: &signer) {
        assert!(!exists<StakingPool>(signer::address_of(admin)), ERR_ALREADY_INITIALIZED);
        
        move_to(admin, StakingPool {
            total_stake: 0,
            validators: table::new(),
            stake_events: event::new_event_handle<StakeEvent>(admin),
            unstake_events: event::new_event_handle<UnstakeEvent>(admin),
            restake_events: event::new_event_handle<RestakeEvent>(admin),
        });
    }

    public fun stake(validator: &signer, amount: u64) acquires StakingPool {
        let validator_address = signer::address_of(validator);
        let pool = borrow_global_mut<StakingPool>(@aptos_framework);

        assert!(coin::balance<AptosCoin>(validator_address) >= amount, ERR_INSUFFICIENT_BALANCE);
        assert!(amount >= MINIMUM_STAKE, ERR_INSUFFICIENT_STAKE);

        let stake_coin = coin::withdraw<AptosCoin>(validator, amount);
        coin::deposit(@aptos_framework, stake_coin);

        if (!table::contains(&pool.validators, validator_address)) {
            table::add(&mut pool.validators, validator_address, ValidatorStake {
                amount: 0,
                last_stake_timestamp: 0,
                cooldown_end: 0,
            });
        };

        let validator_stake = table::borrow_mut(&mut pool.validators, validator_address);
        validator_stake.amount = validator_stake.amount + amount;
        validator_stake.last_stake_timestamp = timestamp::now_seconds();

        pool.total_stake = pool.total_stake + amount;

        event::emit_event(&mut pool.stake_events, StakeEvent {
            validator: validator_address,
            amount,
        });
    }

    public fun unstake(validator: &signer, amount: u64) acquires StakingPool {
        let validator_address = signer::address_of(validator);
        let pool = borrow_global_mut<StakingPool>(@aptos_framework);

        assert!(table::contains(&pool.validators, validator_address), ERR_NOT_AUTHORIZED);
        let validator_stake = table::borrow_mut(&mut pool.validators, validator_address);

        assert!(validator_stake.amount >= amount, ERR_INSUFFICIENT_STAKE);
        assert!(timestamp::now_seconds() >= validator_stake.cooldown_end, ERR_COOLDOWN_PERIOD);

        validator_stake.amount = validator_stake.amount - amount;
        pool.total_stake = pool.total_stake - amount;

        let unstake_coin = coin::withdraw<AptosCoin>(&@aptos_framework, amount);
        coin::deposit(validator_address, unstake_coin);

        validator_stake.cooldown_end = timestamp::now_seconds() + COOLDOWN_PERIOD;

        event::emit_event(&mut pool.unstake_events, UnstakeEvent {
            validator: validator_address,
            amount,
        });
    }

    public fun restake(validator: &signer, amount: u64, target: address) acquires StakingPool {
        let validator_address = signer::address_of(validator);
        let pool = borrow_global_mut<StakingPool>(@aptos_framework);

        assert!(table::contains(&pool.validators, validator_address), ERR_NOT_AUTHORIZED);
        let validator_stake = table::borrow_mut(&mut pool.validators, validator_address);

        assert!(validator_stake.amount >= amount, ERR_INSUFFICIENT_STAKE);
        assert!(timestamp::now_seconds() >= validator_stake.cooldown_end, ERR_COOLDOWN_PERIOD);

        validator_stake.amount = validator_stake.amount - amount;

        if (!table::contains(&pool.validators, target)) {
            table::add(&mut pool.validators, target, ValidatorStake {
                amount: 0,
                last_stake_timestamp: 0,
                cooldown_end: 0,
            });
        };

        let target_stake = table::borrow_mut(&mut pool.validators, target);
        target_stake.amount = target_stake.amount + amount;
        target_stake.last_stake_timestamp = timestamp::now_seconds();

        event::emit_event(&mut pool.restake_events, RestakeEvent {
            validator: validator_address,
            amount,
            target,
        });
    }

    public fun get_validator_stake(validator_address: address): u64 acquires StakingPool {
        let pool = borrow_global<StakingPool>(@aptos_framework);
        if (table::contains(&pool.validators, validator_address)) {
            table::borrow(&pool.validators, validator_address).amount
        } else {
            0
        }
    }

    public fun get_total_stake(): u64 acquires StakingPool {
        borrow_global<StakingPool>(@aptos_framework).total_stake
    }

    public fun is_validator(validator_address: address): bool acquires StakingPool {
        let pool = borrow_global<StakingPool>(@aptos_framework);
        table::contains(&pool.validators, validator_address) &&
        table::borrow(&pool.validators, validator_address).amount >= MINIMUM_STAKE
    }
}