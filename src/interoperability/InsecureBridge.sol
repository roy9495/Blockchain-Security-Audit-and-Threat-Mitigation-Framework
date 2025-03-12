pragma solidity ^0.8.19;

contract InsecureBridge {
    mapping(bytes32 => bool) public processedMessages;

    function processMessage(bytes32 messageId) public {
        require(!processedMessages[messageId], "Message already processed");
        processedMessages[messageId] = true;
        // 🚨 No authentication mechanism!
    }
}
