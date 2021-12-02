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
        beforeEach(async function () {
            //owner mints tokens to himself and approves them to the exchange contract so he can deposit
            await tokenA.mint(owner.address, 1000000);
            await tokenA.approve(tokenExchange.address, 100000);
            await tokenB.mint(owner.address, 1000000);
            await tokenB.approve(tokenExchange.address, 100000);
        });

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

    describe("exchange", function () {
        beforeEach(async function () {
            //owner mints tokens to himself and approves them to the exchange contract so he can deposit
            await tokenA.mint(owner.address, 1000000);
            await tokenA.approve(tokenExchange.address, 100000);
            await tokenB.mint(owner.address, 1000000);
            await tokenB.approve(tokenExchange.address, 100000);

            await tokenExchange.deposit(tokenA.address, 100000);
            await tokenExchange.deposit(tokenB.address, 100000);

            //owner sends tokens to user
            await tokenA.transfer(addr1.address, 1000);
            await tokenB.transfer(addr1.address, 10);
            //user approves tokens to the exchange contract so he can exchange
            await tokenA.connect(addr1).approve(tokenExchange.address, 1000);
            await tokenB.connect(addr1).approve(tokenExchange.address, 10);
        });

        //user calls with 950 tokenA, is charged 900 tokenA, gets back 9 tokenB
        it("Should take and send back expected amount of tokens (tokenA)", async function () {
            const ABalance = await tokenA.balanceOf(addr1.address);
            const BBalance = await tokenB.balanceOf(addr1.address);

            const AExpectedBalance = +ABalance - 900;
            const BExpectedBalance = +BBalance + 9;

            await tokenExchange.connect(addr1).exchange(tokenA.address, 950);

            expect(await tokenA.balanceOf(addr1.address)).to.equal(AExpectedBalance);
            expect(await tokenB.balanceOf(addr1.address)).to.equal(BExpectedBalance);
        });

        //user calls with 9 tokenB, is charged 9 tokenB, gets back 900 tokenA
        it("Should take and send back expected amount of tokens (tokenB)", async function () {
            const BBalance = await tokenB.balanceOf(addr1.address);
            const ABalance = await tokenA.balanceOf(addr1.address);

            const BExpectedBalance = +BBalance - 9;
            const AExpectedBalance = +ABalance + 900;

            await tokenExchange.connect(addr1).exchange(tokenB.address, 9);

            expect(await tokenB.balanceOf(addr1.address)).to.equal(BExpectedBalance);
            expect(await tokenA.balanceOf(addr1.address)).to.equal(AExpectedBalance);
        });

        it("Should fail if contract does not have enough tokens to send back", async function () {
            await expect(
                tokenExchange.exchange(tokenB.address, 2000)
            ).to.be.revertedWith("TokenExchange: Insufficient contract balance");
        });

        it("Should fail if called provided wrong address", async function () {
            await expect(
                tokenExchange.exchange(addr1.address, 1000)
            ).to.be.revertedWith("TokenExchange: Wrong token address");
        });

        it("Should fail if called provided zero amount", async function () {
            await expect(
                tokenExchange.exchange(tokenA.address, 0)
            ).to.be.revertedWith("TokenExchange: Amount must be greater than zero");
        });
    });
});