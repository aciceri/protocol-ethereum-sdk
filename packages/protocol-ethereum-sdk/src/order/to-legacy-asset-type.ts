import { Address, AssetType, BigNumber } from "@rarible/protocol-api-client"
import { toBigNumber, ZERO_ADDRESS } from "@rarible/types"

type LegacyAssetType = {
	assetType: number
	token: Address
	tokenId: BigNumber
}

export function toLegacyAssetType(assetType: AssetType): LegacyAssetType {
	switch (assetType.assetClass) {
		case "ETH":
			return {
				assetType: 0,
				token: ZERO_ADDRESS,
				tokenId: toBigNumber("0"),
			}
		case "ERC20":
			return {
				assetType: 1,
				token: assetType.contract,
				tokenId: toBigNumber("0"),
			}
		case "ERC721":
			return {
				assetType: 3,
				token: assetType.contract,
				tokenId: assetType.tokenId,
			}
		case "ERC1155":
			return {
				assetType: 2,
				token: assetType.contract,
				tokenId: assetType.tokenId,
			}
		default: {
			throw new Error("Unsupported")
		}
	}
}
