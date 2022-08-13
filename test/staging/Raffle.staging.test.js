const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", function () {
          let raffle, raffleEntranceFee, deployer, accounts

          beforeEach(async function () {
              accounts = await ethers.getSigners()
              deployer = accounts[0].address
              raffle = await ethers.getContract("Raffle", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
          })

          describe("fulfillRandomWords", function () {
              it("works with live Chainlink Keepers and VRF, we get a random winner", async function () {
                  console.log("Setting up test...")
                  const startingTimeStamp = await raffle.getLastTimeStamp()
                  let winnerStartingBalance = await accounts[0].getBalance()

                  // setup listener before we enter raffle
                  console.log("Setting up listener...")
                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          console.log("winnerPicked event found!")
                          try {
                              //   setTimeout(async () => {
                              // asserts
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerEndingBalance = await accounts[0].getBalance()
                              const endingTimeStamp = await raffle.getLastTimeStamp()

                              await expect(raffle.getPlayer(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(raffleEntranceFee).toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                              assert.equal(raffleState, 0)
                              resolve()
                              //   }, 15000)
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      console.log("Entering raffle...")
                      const txResponse = await raffle.enterRaffle({ value: raffleEntranceFee })
                      const txReceipt = await txResponse.wait(1)
                      console.log("Raffle entry confirmed!")
                      winnerStartingBalance = await accounts[0].getBalance()
                  })
              })
          })
      })
