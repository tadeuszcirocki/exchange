const { expect } = require("chai");

describe("TokenExchange contract", function () {

    let TokenA;
    let tokenA;
    let TokenB;
    let tokenB;
    let TokenExchange;
    let tokenExchange;

    let owner;
    let addr1;
    let addr2;
    let addrs;

    before(async function () {
        TokenExchange = await ethers.getContractFactory("TokenExchange");
        TokenA = await ethers.getContractFactory("TokenA");
        TokenB = await ethers.getContractFactory("TokenB");
    });

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        tokenA = await TokenA.deploy();
        await tokenA.deployed();
        tokenB = await TokenB.deploy();
        await tokenB.deployed();
        tokenExchange = await TokenExchange.deploy(tokenA.address, tokenB.address, 100);
        await tokenExchange.deployed();

        //OWNER mints tokens and approves them to exchange contract
        await tokenA.mint(owner.address, 1000000);
        await tokenA.approve(tokenExchange.address, 100000);
        await tokenB.mint(owner.address, 1000000);
        await tokenB.approve(tokenExchange.address, 100000);

        //USER gets tokens and approves them to exchange contract
        await tokenA.transfer(addr1.address, 1000);
        await tokenA.connect(addr1).approve(tokenExchange.address, 1000);
    });

    describe("constructor", function () {
        it("Should set the right owner", async function () {
            expect(await tokenExchange.owner()).to.equal(owner.address);
        });

        it("Should succeed when provided with addresses and price", async function () {
            expect(await tokenExchange.price()).to.equal(100);
        });
    });

    describe("updatePrice", function () {
        it("Should set the price as expected when owner calls", async function () {
            await tokenExchange.updatePrice(200);
            expect(await tokenExchange.price()).to.equal(200);
        });

        it("Should fail if someone other than owner calls", async function () {
            await expect(
                tokenExchange.connect(addr1).updatePrice(200)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("deposit", function () {
        it("Should deposit expected amount of tokens when owner calls providing correct address", async function () {
            await tokenExchange.deposit(tokenB.address, 100000);
            expect(await tokenB.balanceOf(tokenExchange.address)).to.equal(100000);
        });

        it("Should fail if owner calls providing wrong address", async function () {
            await expect(
                tokenExchange.deposit(addr1.address, 1000)
            ).to.be.revertedWith("TokenExchange: Wrong token address");
        });

        it("Should fail if someone other than owner calls", async function () {
            await expect(
                tokenExchange.connect(addr1).deposit(tokenB.address, 1000)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

    });

});