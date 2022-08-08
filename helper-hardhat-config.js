const { ethers } = require("hardhat")

const networkConfig = {
    4: {
        name: "rinkeby",
        vrfCoordinatorV2: "0x0",
        entranceFee: ethers.utils.parseEther("0.01"),
    },
    31337: {
        name: "hardhat",
        entranceFee: ethers.utils.parseEther("0.01"),
    },
}

const developmentChains = ["hardhat", "locahost"]

module.exports = {
    networkConfig,
    developmentChains,
}
