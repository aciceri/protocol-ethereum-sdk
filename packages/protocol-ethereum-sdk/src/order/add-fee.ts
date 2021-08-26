import { Asset } from "@rarible/protocol-api-client"
import { toBn } from "../common/to-bn"
import BN from "bignumber.js"
import { toBigNumber } from "@rarible/types/build/big-number"

export function addFee(asset: Asset, fee: number): Asset {
	const value = toBn(asset.value).multipliedBy(10000 + fee).dividedBy(10000).integerValue(BN.ROUND_FLOOR)
	return {
		...asset,
		value: toBigNumber(value.toFixed()),
	}
}