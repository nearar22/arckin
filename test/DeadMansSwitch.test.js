const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const USDC = (n) => ethers.parseUnits(n.toString(), 6);
const DAY = 24 * 60 * 60;

describe("DeadMansSwitch", function () {
  let dms, usdc, owner, heir1, heir2, keeper;

  beforeEach(async function () {
    [owner, heir1, heir2, keeper] = await ethers.getSigners();

    const Mock = await ethers.getContractFactory("MockUSDC");
    usdc = await Mock.deploy();

    const DMS = await ethers.getContractFactory("DeadMansSwitch");
    dms = await DMS.deploy();

    await usdc.mint(owner.address, USDC(10_000));
    await usdc.connect(owner).approve(await dms.getAddress(), USDC(10_000));
  });

  function heirs(...entries) {
    return entries.map(([account, shares]) => ({ account, shares }));
  }

  async function createDefault(amount = USDC(1000), interval = 30 * DAY) {
    const tx = await dms
      .connect(owner)
      .createSwitch(
        await usdc.getAddress(),
        amount,
        interval,
        heirs([heir1.address, 6000], [heir2.address, 4000])
      );
    await tx.wait();
    return 0n; // first switch id
  }

  describe("createSwitch", function () {
    it("locks funds and stores config", async function () {
      const id = await createDefault();
      const s = await dms.getSwitch(id);
      expect(s.owner).to.equal(owner.address);
      expect(s.balance).to.equal(USDC(1000));
      expect(s.released).to.equal(false);
      expect(await usdc.balanceOf(await dms.getAddress())).to.equal(USDC(1000));
    });

    it("rejects shares that don't sum to 100%", async function () {
      await expect(
        dms
          .connect(owner)
          .createSwitch(
            await usdc.getAddress(),
            USDC(100),
            30 * DAY,
            heirs([heir1.address, 5000], [heir2.address, 4000])
          )
      ).to.be.revertedWithCustomError(dms, "InvalidShares");
    });

    it("rejects a zero check-in interval", async function () {
      await expect(
        dms
          .connect(owner)
          .createSwitch(
            await usdc.getAddress(),
            USDC(100),
            0,
            heirs([heir1.address, 10000])
          )
      ).to.be.revertedWithCustomError(dms, "InvalidInterval");
    });
  });

  describe("check-in lifecycle", function () {
    it("is not tripped right after creation", async function () {
      const id = await createDefault();
      expect(await dms.isTripped(id)).to.equal(false);
    });

    it("trips after the interval passes without check-in", async function () {
      const id = await createDefault(USDC(1000), 30 * DAY);
      await time.increase(30 * DAY + 1);
      expect(await dms.isTripped(id)).to.equal(true);
    });

    it("check-in resets the countdown", async function () {
      const id = await createDefault(USDC(1000), 30 * DAY);
      await time.increase(29 * DAY);
      await dms.connect(owner).checkIn(id);
      await time.increase(29 * DAY);
      expect(await dms.isTripped(id)).to.equal(false);
    });

    it("only owner can check in", async function () {
      const id = await createDefault();
      await expect(dms.connect(heir1).checkIn(id)).to.be.revertedWithCustomError(
        dms,
        "NotOwner"
      );
    });
  });

  describe("owner controls while alive", function () {
    it("allows deposits and withdrawals", async function () {
      const id = await createDefault(USDC(1000));
      await dms.connect(owner).deposit(id, USDC(500));
      expect((await dms.getSwitch(id)).balance).to.equal(USDC(1500));

      await dms.connect(owner).withdraw(id, USDC(200));
      expect((await dms.getSwitch(id)).balance).to.equal(USDC(1300));
    });

    it("cannot withdraw more than the balance", async function () {
      const id = await createDefault(USDC(1000));
      await expect(
        dms.connect(owner).withdraw(id, USDC(2000))
      ).to.be.revertedWithCustomError(dms, "AmountTooHigh");
    });

    it("can update beneficiaries", async function () {
      const id = await createDefault();
      await dms
        .connect(owner)
        .updateBeneficiaries(id, heirs([heir1.address, 10000]));
      const list = await dms.getBeneficiaries(id);
      expect(list.length).to.equal(1);
      expect(list[0].account).to.equal(heir1.address);
    });
  });

  describe("release", function () {
    it("cannot be released while still active", async function () {
      const id = await createDefault();
      await expect(dms.release(id)).to.be.revertedWithCustomError(
        dms,
        "SwitchStillActive"
      );
    });

    it("distributes funds by shares once tripped", async function () {
      const id = await createDefault(USDC(1000), 30 * DAY);
      await time.increase(30 * DAY + 1);

      // A keeper (not the owner, not an heir) triggers the release.
      await dms.connect(keeper).release(id);

      expect(await usdc.balanceOf(heir1.address)).to.equal(USDC(600));
      expect(await usdc.balanceOf(heir2.address)).to.equal(USDC(400));
      expect((await dms.getSwitch(id)).balance).to.equal(0);
      expect((await dms.getSwitch(id)).released).to.equal(true);
    });

    it("cannot be released twice", async function () {
      const id = await createDefault(USDC(1000), 30 * DAY);
      await time.increase(30 * DAY + 1);
      await dms.connect(keeper).release(id);
      await expect(dms.release(id)).to.be.revertedWithCustomError(
        dms,
        "AlreadyReleased"
      );
    });

    it("gives rounding dust to the last beneficiary", async function () {
      // 1 wei-USDC split three ways can't divide evenly.
      const tx = await dms
        .connect(owner)
        .createSwitch(
          await usdc.getAddress(),
          1, // 0.000001 USDC
          DAY,
          heirs(
            [heir1.address, 3333],
            [heir2.address, 3333],
            [keeper.address, 3334]
          )
        );
      await tx.wait();
      const id = 0n;
      await time.increase(DAY + 1);

      const before1 = await usdc.balanceOf(heir1.address);
      const before2 = await usdc.balanceOf(heir2.address);
      const before3 = await usdc.balanceOf(keeper.address);
      await dms.connect(keeper).release(id);

      // 1 unit total: first two get floor(1 * share) = 0, last gets remainder = 1.
      expect((await usdc.balanceOf(heir1.address)) - before1).to.equal(0);
      expect((await usdc.balanceOf(heir2.address)) - before2).to.equal(0);
      expect((await usdc.balanceOf(keeper.address)) - before3).to.equal(1);
    });
  });
});
