import {
  LogIndexUpdate,
  LogAddMarket,
  LogBuy,
  LogSell
} from "../generated/SoloMargin/SoloMargin";
import { Market, Long, Short } from "../generated/schema";
import { store } from "@graphprotocol/graph-ts";

export function handleLogIndexUpdate(event: LogIndexUpdate): void {
  let id = event.params.market.toString();
  let entity = Market.load(id);
  entity.borrowIndex = event.params.index.borrow;
  entity.supplyIndex = event.params.index.supply;
  entity.lastIndexUpdate = event.params.index.lastUpdate;
  entity.save();
}

export function handleLogAddMarket(event: LogAddMarket): void {
  let id = event.params.marketId.toString();
  let entity = new Market(id);
  entity.tokenAddress = event.params.token;
  entity.tokenSymbol = getTokenSymbol(id);
  entity.save();
}

function getTokenSymbol(id: String): String {
  if (id == "0") return "WETH";
  else if (id == "1") return "DAI";
  else if (id == "2") return "USDC";
  else return id;
}

export function handleLogBuy(event: LogBuy): void {
  if (
    event.params.makerUpdate.deltaWei.sign == true &&
    event.params.makerUpdate.newPar.sign == true
  ) {
    let entity = new Long(
      event.params.accountOwner.toHexString() +
        "-" +
        event.params.accountNumber.toString() +
        "-" +
        event.params.takerMarket.toString()
    );
    entity.accountOwner = event.params.accountOwner;
    entity.accountNumber = event.params.accountNumber;
    entity.takerMarketId = event.params.takerMarket;
    entity.makerMarketId = event.params.makerMarket;
    entity.market =
      getTokenSymbol(event.params.makerMarket.toString()) +
      "-" +
      getTokenSymbol(event.params.takerMarket.toString());
    /*
    entity.takerUpdate_deltaWei_sign = event.params.takerUpdate.deltaWei.sign;
    entity.takerUpdate_deltaWei_value = event.params.takerUpdate.deltaWei.value;
    entity.takerUpdate_newPar_sign = event.params.takerUpdate.newPar.sign;
    entity.takerUpdate_newPar_value = event.params.takerUpdate.newPar.value;
    entity.makerUpdate_deltaWei_sign = event.params.makerUpdate.deltaWei.sign;
    entity.makerUpdate_deltaWei_value = event.params.makerUpdate.deltaWei.value;
    entity.makerUpdate_newPar_sign = event.params.makerUpdate.newPar.sign;
    entity.makerUpdate_newPar_value = event.params.makerUpdate.newPar.value;
    */
    entity.exchangeWrapper = event.params.exchangeWrapper;
    entity.timestamp = event.block.timestamp;
    entity.amount = event.params.makerUpdate.newPar.value;
    entity.marginDeposit =
      event.params.makerUpdate.newPar.value -
      event.params.makerUpdate.deltaWei.value;
    entity.openPrice =
      event.params.takerUpdate.deltaWei.value.toBigDecimal() /
      event.params.makerUpdate.deltaWei.value.toBigDecimal();
    entity.leverage =
      event.params.makerUpdate.newPar.value.toBigDecimal() /
      (event.params.makerUpdate.newPar.value.toBigDecimal() -
        event.params.makerUpdate.deltaWei.value.toBigDecimal());
    entity.closed = false;
    entity.save();
  } else if (
    event.params.takerUpdate.deltaWei.sign == false &&
    event.params.takerUpdate.newPar.sign == true
  ) {
    let id =
      event.params.accountOwner.toHexString() +
      "-" +
      event.params.accountNumber.toString() +
      "-" +
      event.params.makerMarket.toString();
    let entity = Long.load(id);
    if (entity != null) {
      entity.amount = event.params.takerUpdate.newPar.value;
      if (event.params.makerUpdate.newPar.value.toString() == "0") {
        entity.closed = true;
      }
      entity.save();
    }
  }
}

export function handleLogSell(event: LogSell): void {
  if (
    event.params.takerUpdate.deltaWei.sign == false &&
    event.params.takerUpdate.newPar.sign == false
  ) {
    let entity = new Short(
      event.params.accountOwner.toHexString() +
        "-" +
        event.params.accountNumber.toString() +
        "-" +
        event.params.takerMarket.toString()
    );
    entity.accountOwner = event.params.accountOwner;
    entity.accountNumber = event.params.accountNumber;
    entity.takerMarketId = event.params.takerMarket;
    entity.makerMarketId = event.params.makerMarket;
    entity.market =
      getTokenSymbol(event.params.takerMarket.toString()) +
      "-" +
      getTokenSymbol(event.params.makerMarket.toString());
    entity.takerUpdate_deltaWei_sign = event.params.takerUpdate.deltaWei.sign;
    entity.takerUpdate_deltaWei_value = event.params.takerUpdate.deltaWei.value;
    entity.takerUpdate_newPar_sign = event.params.takerUpdate.newPar.sign;
    entity.takerUpdate_newPar_value = event.params.takerUpdate.newPar.value;
    entity.makerUpdate_deltaWei_sign = event.params.makerUpdate.deltaWei.sign;
    entity.makerUpdate_deltaWei_value = event.params.makerUpdate.deltaWei.value;
    entity.makerUpdate_newPar_sign = event.params.makerUpdate.newPar.sign;
    entity.makerUpdate_newPar_value = event.params.makerUpdate.newPar.value;
    entity.exchangeWrapper = event.params.exchangeWrapper;
    entity.timestamp = event.block.timestamp;
    entity.amount = event.params.makerUpdate.newPar.value;
    entity.marginDeposit =
      event.params.makerUpdate.newPar.value -
      event.params.makerUpdate.deltaWei.value;
    entity.openPrice =
      entity.makerUpdate_deltaWei_value.toBigDecimal() /
      entity.takerUpdate_deltaWei_value.toBigDecimal();
    entity.leverage =
      entity.makerUpdate_deltaWei_value.toBigDecimal() /
      (entity.makerUpdate_newPar_value.toBigDecimal() -
        entity.makerUpdate_deltaWei_value.toBigDecimal());
    entity.save();
  }
}
