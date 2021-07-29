import { deployTestErc20 } from "./contracts/test/test-erc20"
import { deployTestErc721 } from "./contracts/test/test-erc721"
import { deployTransferProxy } from "./contracts/test/test-transfer-proxy"
import { deployErc20TransferProxy } from "./contracts/test/test-erc20-transfer-proxy"
import { deployTestExchangeV2 } from "./contracts/test/test-exchange-v2"
import { deployTestRoyaltiesProvider } from "./contracts/test/test-royalties-provider"
import { Contract } from "web3-eth-contract"
import { randomWord, toAddress, toBigNumber, toBinary } from "@rarible/types"
import { sentTx } from "../common/send-transaction"
import { BN } from "ethereumjs-util"
import { fillOrder } from "./fill-order"
import { signOrder, SimpleOrder } from "./sign-order"
import { createGanacheProvider } from "../test/create-ganache-provider"

describe("fillOrder", () => {
	const { web3, addresses } = createGanacheProvider()
	const [sender1Address, sender2Address] = addresses

	let testErc20: Contract
	let testErc721: Contract
	let transferProxy: Contract
	let erc20TransferProxy: Contract
	let royaltiesProvider: Contract
	let exchangeV2: Contract

	beforeAll(async () => {
		/**
		 * Deploy
		 */
		testErc20 = await deployTestErc20(web3, "Test1", "TST1")
		testErc721 = await deployTestErc721(web3, "Test", "TST")
		transferProxy = await deployTransferProxy(web3)
		erc20TransferProxy = await deployErc20TransferProxy(web3)
		royaltiesProvider = await deployTestRoyaltiesProvider(web3)
		exchangeV2 = await deployTestExchangeV2(web3)
		/**
		 * Configuring
		 */
		await sentTx(exchangeV2.methods.__ExchangeV2_init(
			toAddress(transferProxy.options.address),
			toAddress(erc20TransferProxy.options.address),
			toBigNumber('0'),
			sender1Address,
			toAddress(royaltiesProvider.options.address),
		), { from: sender1Address })
		await sentTx(transferProxy.methods.addOperator(toAddress(exchangeV2.options.address)), { from: sender1Address })
		await sentTx(erc20TransferProxy.methods.addOperator(toAddress(exchangeV2.options.address)), { from: sender1Address })
	})

	test('should match order(buy erc721 for erc20)', async () => {
		//sender1 has ERC20, sender2 has ERC721

		await sentTx(testErc20.methods.mint(sender1Address, 100), { from: sender1Address })
		await sentTx(testErc721.methods.mint(sender2Address, "1", 'https://example.com'), { from: sender1Address })

		const left: SimpleOrder = {
			make: {
				assetType: {
					assetClass: "ERC721",
					contract: toAddress(testErc721.options.address),
					tokenId: toBigNumber("1"),
				},
				value: toBigNumber("1"),
			},
			maker: sender2Address,
			take: {
				assetType: {
					assetClass: "ERC20",
					contract: toAddress(testErc20.options.address),
				},
				value: toBigNumber("10"),
			},
			salt: toBinary(randomWord()),
			type: 'RARIBLE_V2',
			data: {
				dataType: "RARIBLE_V2_DATA_V1",
				payouts: [],
				originFees: [],
			},
		}

		//todo approve using our functions
		await sentTx(
			testErc20.methods.approve(
				erc20TransferProxy.options.address,
				new BN(10),
			),
			{ from: sender1Address },
		)

		await sentTx(
			testErc721.methods.setApprovalForAll(transferProxy.options.address, true),
			{ from: sender2Address },
		)

		const a = toAddress(exchangeV2.options.address)
		const signature = await signOrder(web3, { chainId: 1, exchange: { v1: a, v2: a } }, left)

		const hash = await fillOrder(
			sentTx,
			web3,
			toAddress(exchangeV2.options.address),
			{ ...left, signature },
			{ amount: 1, payouts: [], originFees: [] },
		)
		console.log('sender1 nft', await testErc721.methods.balanceOf(sender1Address).call(), 'sender2 nft', await testErc721.methods.balanceOf(sender2Address).call())
		const receipt = await web3.eth.getTransactionReceipt(hash as string)
		console.log('receipt', receipt)
	})
})