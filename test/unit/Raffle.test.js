const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
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

          describe.skip("fulfillRandomWords", async function () {
              beforeEach(async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
              })

              it("picks a winner, resets the lottery and sends money", async function () {
                  const additionalEntrants = 3
                  const startingAccountIndex = 1 // deployer = 0
                  const account = await ethers.getSigners()
                  for (
                      let i = startingAccountIndex;
                      i < startingAccountIndex + additionalEntrants;
                      i++
                  ) {
                      const accountConnectedRaffle = raffle.connect(account[i])
                      await accountConnectedRaffle.enterRaffle({ value: raffleEntranceFee })
                  }
                  //   const startingTimeStamp = await raffle.getLastestTimeStamp()
                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          try {
                              const recentWinner = await raffle.getRecentWinner()
                              //   const raffleState = await raffle.getRaffleState()
                              //   const endingTimeStamp = await raffle.getLastestTimeStamp()

                              assert.equal(recentWinner)
                          } catch (e) {
                              reject(e)
                          }
                          resolve()
                      })
                      //   const tx = await raffle.performUpkeep([])
                      //   const txReceipt = await tx.wait(1)
                      await vrfCoordinatorV2Mock.fulfillRandomWords(
                          txReceipt.events[1].args.requestId,
                          raffle.address
                      )
                  })
              })
          })
      })
