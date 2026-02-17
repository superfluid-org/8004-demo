// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

library AddressRegistry {
    struct DeployedAddresses {
        address agentPoolDistributor;
    }

    function getNetworkConfig(uint256 chainId)
        internal
        pure
        returns (DeployedAddresses memory addresses)
    {
        if (chainId == 8453) {
            addresses = getBaseMainnetAddresses();
        } else if (chainId == 84532) {
            addresses = getBaseSepoliaAddresses();
        } else {
            revert("Unsupported chainId");
        }
    }

    /**
     * @dev Get Base Mainnet configuration
     */
    function getBaseMainnetAddresses() internal pure returns (DeployedAddresses memory addresses) {
        return DeployedAddresses({agentPoolDistributor: address(0)});
    }

    /**
     * @dev Get Base Mainnet configuration
     */
    function getBaseSepoliaAddresses() internal pure returns (DeployedAddresses memory addresses) {
        return DeployedAddresses({agentPoolDistributor: address(0)});
    }
}
