const { expect , assert } = require("chai");
const { ethers } = require("hardhat");

describe("The whole test started!",async function () {
  let deployer, user1, user2, user3, user4;
  let Store_deployed, StoreContract;

  beforeEach(async function () {
    [deployer, user1, user2, user3, user4] = await ethers.getSigners();
    const Store_deploy = await ethers.getContractFactory("Store");
    StoreContract = await Store_deploy.deploy(user1.address);
    Store_deployed = await StoreContract.deployed();
  });

  describe("Store", async function () {
    it("Add user", async function () {
      await StoreContract.connect(user1).addUser(user2.address);
      expect(await StoreContract.users(user2.address)).equal(true);
    });

    it("Remove user", async function () {
      await StoreContract.connect(user1).addUser(user2.address);
      expect(await StoreContract.users(user2.address)).equal(true);
      await StoreContract.connect(user1).removeUser(user2.address);
      expect(await StoreContract.users(user2.address)).equal(false);
    });

    it("Count of assets", async function () {
      await StoreContract.connect(user1).mintAsset(user2.address, 0, "{Name:Car}");
      await StoreContract.connect(user1).mintAsset(user2.address, 1, "{Name:Car}");
      await StoreContract.connect(user1).mintAsset(user2.address, 2, "{Name:Car}");
      await StoreContract.connect(user1).mintAsset(user2.address, 3, "{Name:Car}");
      expect(await StoreContract.countOfAsset()).equal(4);
    });

    it("Get Property",  async function() {
      await StoreContract.connect(user1).mintAsset(user2.address, 0, "{Name:Car}");
      await StoreContract.connect(user1).mintAsset(user2.address, 1, "{Name:Animal}");
      await StoreContract.connect(user1).mintAsset(user2.address, 2, "{Name:Bus}");
      await StoreContract.connect(user1).mintAsset(user2.address, 3, "{Name:Banana}");
      expect(await StoreContract.getProperty(3)).equal("{Name:Banana}");
    })

    it("Mint assets", async function () {
      await StoreContract.connect(user1).mintAsset(user2.address, 0, "{Name:Car}");
      await StoreContract.connect(user1).mintAsset(user2.address, 1, "{Name:Seed}");
      expect(await StoreContract.getProperty(0)).equal("{Name:Car}");
      expect(await StoreContract.getProperty(1)).equal("{Name:Seed}");
      expect(await StoreContract.countOfAsset()).equal(2);
      expect(StoreContract.connect(user1).mintAsset(user2.address, 3, "{Name:Car}")).to.be.revertedWith("Store: invalid token ID");
    });

    it("Add histories", async function () {
      await StoreContract.connect(user1).mintAsset(user2.address, 0, "{Name:Car}");
      await StoreContract.connect(user1).mintAsset(user2.address, 1, "{Name:Seed}");
      await StoreContract.connect(user1).addUser(user2.address);
      await StoreContract.connect(user2).addHistory(0, "{action:Move, description:'A to B'}");
      expect(await StoreContract.getTotalHistoryLength()).equal(1);
      expect(await StoreContract.getAssetHistoryLength(0)).equal(1);
      expect(await StoreContract.getAssetHistoryLength(1)).equal(0);
      expect(await StoreContract.getAssetHistory(0, 0)).equal("{action:Move, description:'A to B'}");
      await StoreContract.getTotalHistory(0);
    })

    it("core owner", async function () {
      await expect(StoreContract.connect(user2).addUser(user2.address)).to.be.revertedWith("Store: Only core user can add users");
      await expect(StoreContract.connect(user2).removeUser(user2.address)).to.be.revertedWith("Store: Only core user can remove users");
      await expect(StoreContract.connect(user2).mintAsset(user2.address, 0, "{Name:Car}")).to.be.revertedWith("Store: only core owner can create assets");
    });
  });

  describe("Fraction", async function () {
    it("safeTransfer one asset", async function () {
      await StoreContract.connect(user1).addUser(user2.address);
      await StoreContract.connect(user1).mintAsset(user2.address, 0, "{Name:Car}");
      expect(await StoreContract.getFranctionalBalances(0, user2.address)).equal(1);
      await StoreContract.connect(user2).safeTransfer(user2.address, user3.address, 0, 1);
      expect(await StoreContract.getFranctionalBalances(0, user2.address)).equal(0);
      expect(await StoreContract.getFranctionalBalances(0, user3.address)).equal(1);
    })
    
    it("Fraction asset", async function () {
      await StoreContract.connect(user1).addUser(user2.address);
      await StoreContract.connect(user1).mintAsset(user2.address, 0, "{Name:Car}");
      await StoreContract.connect(user2).fractionAsset(0, 10);
    });

    it("safeTransfer asset after fraction", async function () {
      await StoreContract.connect(user1).addUser(user2.address);
      await StoreContract.connect(user1).mintAsset(user2.address, 0, "{Name:Car}");
      await StoreContract.connect(user2).fractionAsset(0, 10);
      await expect(StoreContract.connect(user3).safeTransfer(user2.address, user3.address, 0, 1)).to.be
        .revertedWith("Fraction: the caller does not allowed to transfer asset fractions");
      expect(await StoreContract.getFranctionalBalances(0, user2.address)).equal(10);
      await StoreContract.connect(user2).safeTransfer(user2.address, user3.address, 0, 1);
      expect(await StoreContract.getFranctionalBalances(0, user2.address)).equal(9);
      expect(await StoreContract.getFranctionalBalances(0, user3.address)).equal(1);
    })

    it("burn asset", async function () {
      await StoreContract.connect(user1).addUser(user2.address);
      await StoreContract.connect(user1).mintAsset(user2.address, 0, "{Name:Car}");
      await StoreContract.connect(user2).fractionAsset(0, 10);
      await StoreContract.connect(user2).burnAsset(0);
      expect(await StoreContract.getFranctionalBalances(0, user2.address)).equal(1);
      await StoreContract.connect(user2).fractionAsset(0, 10);
      await StoreContract.connect(user2).safeTransfer(user2.address, user3.address, 0, 1);
      await expect(StoreContract.connect(user2).burnAsset(0)).to.be.revertedWith("Fraction: the burner must have all asset franctions");
      await StoreContract.connect(user3).safeTransfer(user3.address, user2.address, 0, 1);
      await StoreContract.connect(user2).burnAsset(0);
    })


    it("approve asset", async function () {
      await StoreContract.connect(user1).addUser(user2.address);
      await StoreContract.connect(user1).mintAsset(user2.address, 0, "{Name:Car}");
      await StoreContract.connect(user2).fractionAsset(0, 10);
      await StoreContract.connect(user2).approve(user3.address);
      await StoreContract.connect(user3).safeTransfer(user2.address, user3.address, 0, 1);
      expect(await StoreContract.getFranctionalBalances(0, user2.address)).equal(9);
      expect(await StoreContract.getFranctionalBalances(0, user3.address)).equal(1);
    })
  });
});
