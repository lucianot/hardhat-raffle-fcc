const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", async function () {
          let raffle, vrfCoordinatorV2Mock, raffleEntranceFee, deployer

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              raffle = await ethers.getContract("Raffle", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
          })

          describe("constructor", async function () {
              it("initializes VRF coordinator correctly", async function () {
                  const expectedVrfCoordinator = vrfCoordinatorV2Mock.address
                  const actualVrfCoordinator = await raffle.getVrfCoordinator()
                  assert.equal(actualVrfCoordinator, expectedVrfCoordinator)
              })

              it("initializes entrance fee correctly", async function () {
                  const expectedEntranceFee = ethers.utils.parseEther("0.01")
                  const actualEntranceFee = await raffle.getEntranceFee()
                  assert.equal(actualEntranceFee.toString(), expectedEntranceFee.toString())
              })
          })

          describe("enterRaffle", async function () {
              it("reverts when the sent value is too low", async function () {
                  const sentValue = ethers.utils.parseEther("0.009")
                  await expect(raffle.enterRaffle({ value: sentValue })).to.be.revertedWith(
                      "Raffle__NotEnoughETHEntered"
                  )
              })

              it("records players when they enter", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  const actualPlayer = await raffle.getPlayer(0)
                  assert.equal(actualPlayer, deployer)
              })

              it("emits event on enter", async function () {
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.emit(
                      raffle,
                      "RaffleEnter"
                  )
              })
          })
      })
