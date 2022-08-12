const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify.js")

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("42")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let vrfCoordinatorV2Mock, vrfCoordinatorV2Address, subscriptionId

    // Deploy VRF coordinator
    if (developmentChains.includes(network.name)) {
        // Hardhat or localhost
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        // get subscriptionId
        const txResponse = await vrfCoordinatorV2Mock.createSubscription()
        const txReceipt = await txResponse.wait()
        subscriptionId = txReceipt.events[0].args.subId
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
    } else {
        // Mainnet or Rinkeby
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    // Deploy Raffle
    const entranceFee = networkConfig[chainId]["entranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const keepersUpdateInterval = networkConfig[chainId]["keepersUpdateInterval"]

    const args = [
        vrfCoordinatorV2Address,
        entranceFee,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        keepersUpdateInterval,
    ]
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    // Manually add consumer (raffle), otherwise performUpkeep does not run
    const addTxResponse = await vrfCoordinatorV2Mock.addConsumer(subscriptionId, raffle.address) // REMOVE
    const addTxReceipt = await addTxResponse.wait()

    // Verify if actual blockchain
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(raffle.address, args)
    }
    log("---------------------------------------")
}

module.exports.tags = ["all", "raffle"]
