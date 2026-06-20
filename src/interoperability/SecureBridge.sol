// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SecureBridge {
    address public owner;
    mapping(bytes32 => bool) public processedMessages;

    event MessageProcessed(bytes32 indexed messageId);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    function processMessage(bytes32 messageId) public onlyOwner {
        require(!processedMessages[messageId], "Message already processed");
        processedMessages[messageId] = true;
        emit MessageProcessed(messageId);
    }
}
