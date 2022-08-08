// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

error Raffle__NotEnoughETHEntered();

// Raffle
contract Raffle {
    /* State Variables */
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;

    /* Events */
    event RaffleEnter(address indexed player);

    constructor(uint256 entranceFee) {
        i_entranceFee = entranceFee;
    }

    // Enter the lottery (pay a certain ammount)
    function enterRaffle() public payable {
        if (msg.value < i_entranceFee) {
            revert Raffle__NotEnoughETHEntered();
        }
        s_players.push(payable(msg.sender));
        emit RaffleEnter(msg.sender);
    }

    // Pick a random winner (verifiably random)
    // function pickRandomWinner() {}

    // Winner to be selected every x minutes -> completly automated
    // Chainlink Oracle -> Randomness, Automatic execution (Chainlink Keeper)

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }
}
