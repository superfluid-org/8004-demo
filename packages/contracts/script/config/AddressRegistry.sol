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
        return DeployedAddresses({agentPoolDistributor: 0x15dcC5564908a3A2C4C7b4659055d0B9e1489A70});
    }

    /**
     * @dev Get Base Mainnet configuration
     */
    function getBaseSepoliaAddresses() internal pure returns (DeployedAddresses memory addresses) {
        return DeployedAddresses({agentPoolDistributor: 0xefeC3A3C466709E17899d852BEEd916a198d34e3});
    }
}
