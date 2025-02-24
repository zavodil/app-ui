import Big from "big.js";
import ls from "local-storage";
import { isValidAccountId, keysToCamel, tokenStorageDeposit } from "./utils";
import useSWR from "swr";
import { useAccount } from "./account";
import { LsKey, NearConfig, TGas } from "./near";
import * as nearAPI from "near-api-js";

const TokenExpirationDuration = 30 * 60 * 1000;

const tokens = {};

export const tokenMatches = (tokenAccountId, label) => {
  const token = tokens[tokenAccountId];
  if (!token || !label) {
    return false;
  }
  label = label.toLowerCase();
  if (token.metadata.symbol.toLowerCase().indexOf(label) >= 0) {
    return true;
  }
  return token.metadata.name.toLowerCase().indexOf(label) >= 0;
};

export const isTokenRegistered = async (account, tokenAccountId, accountId) => {
  const storageBalance = await account.near.account.viewFunction(
    tokenAccountId,
    "storage_balance_of",
    {
      account_id: accountId,
    }
  );
  return storageBalance && storageBalance.total !== "0";
};

export const tokenRegisterStorageAction = async (
  account,
  tokenAccountId,
  actions
) => {
  if (!(await isTokenRegistered(account, tokenAccountId, account.accountId))) {
    actions.push([
      tokenAccountId,
      nearAPI.transactions.functionCall(
        "storage_deposit",
        {
          account_id: account.accountId,
          registration_only: true,
        },
        TGas.mul(5).toFixed(0),
        (await tokenStorageDeposit(tokenAccountId)).toFixed(0)
      ),
    ]);
  }
};

export const WrappedTokenType = {
  WrappedNEAR: "WrappedNEAR",
  WrappedFT: "WrappedFT",
};

export const WrappedTokens = {
  [NearConfig.wrapNearAccountId]: WrappedTokenType.WrappedNEAR,
  "f-aurora.near": WrappedTokenType.WrappedFT,
};

// const tokenBalances = {};

const hardcodedMetadata = (token, tokenAccountId) => {
  if (!token) {
    return token;
  }
  if (tokenAccountId === NearConfig.wrapNearAccountId) {
    token.metadata.symbol = "NEAR";
    token.metadata.icon =
      "data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23111618'%3E%3C/circle%3E%3Cg clip-path='url(%23clip0000000003)'%3E%3Cpath d='M20.8422 8.84471L17.4978 13.776C17.4501 13.847 17.43 13.9328 17.4411 14.0174C17.4522 14.102 17.4938 14.1798 17.5582 14.2363C17.6225 14.2928 17.7053 14.3243 17.7913 14.3249C17.8772 14.3254 17.9604 14.2951 18.0256 14.2395L21.3178 11.4036C21.3371 11.3865 21.361 11.3753 21.3866 11.3714C21.4122 11.3675 21.4383 11.3711 21.4619 11.3818C21.4855 11.3924 21.5054 11.4096 21.5193 11.4314C21.5331 11.4531 21.5403 11.4783 21.54 11.504V20.3824C21.54 20.4095 21.5316 20.4361 21.5158 20.4583C21.5001 20.4806 21.4779 20.4975 21.4522 20.5068C21.4265 20.516 21.3985 20.5172 21.3721 20.5102C21.3456 20.5031 21.322 20.4882 21.3044 20.4673L11.3533 8.63726C11.1933 8.44956 10.994 8.29873 10.7693 8.19525C10.5446 8.09178 10.2999 8.03815 10.0522 8.03809H9.70444C9.2524 8.03809 8.81887 8.21642 8.49922 8.53386C8.17957 8.8513 8 9.28185 8 9.73078V22.2351C8 22.684 8.17957 23.1145 8.49922 23.432C8.81887 23.7494 9.2524 23.9277 9.70444 23.9277V23.9277C9.99591 23.9278 10.2825 23.8537 10.537 23.7125C10.7914 23.5713 11.0051 23.3677 11.1578 23.1211L14.5022 18.1898C14.5499 18.1188 14.57 18.033 14.5589 17.9484C14.5478 17.8638 14.5062 17.7861 14.4418 17.7295C14.3775 17.673 14.2947 17.6415 14.2087 17.641C14.1228 17.6404 14.0396 17.6707 13.9744 17.7264L10.6822 20.5622C10.6629 20.5794 10.639 20.5906 10.6134 20.5944C10.5878 20.5983 10.5617 20.5947 10.5381 20.5841C10.5145 20.5734 10.4946 20.5562 10.4807 20.5345C10.4669 20.5128 10.4597 20.4875 10.46 20.4618V11.5813C10.46 11.5541 10.4684 11.5276 10.4842 11.5053C10.4999 11.483 10.5221 11.4661 10.5478 11.4568C10.5735 11.4476 10.6015 11.4464 10.6279 11.4534C10.6544 11.4605 10.678 11.4755 10.6956 11.4963L20.6456 23.3286C20.8056 23.5163 21.0049 23.6671 21.2296 23.7706C21.4543 23.874 21.699 23.9277 21.9467 23.9277H22.2944C22.5184 23.9279 22.7401 23.8842 22.947 23.7992C23.154 23.7142 23.342 23.5895 23.5004 23.4324C23.6588 23.2752 23.7844 23.0885 23.8702 22.8831C23.9559 22.6776 24 22.4574 24 22.2351V9.73078C24 9.28185 23.8204 8.8513 23.5008 8.53386C23.1811 8.21642 22.7476 8.03809 22.2956 8.03809C22.0041 8.03801 21.7175 8.11211 21.4631 8.25332C21.2086 8.39453 20.9949 8.59814 20.8422 8.84471V8.84471Z' fill='white'%3E%3C/path%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='clip00033'%3E%3Crect width='16' height='16' fill='white' transform='translate(8 7.9834)'%3E%3C/rect%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E";
  }
  if (tokenAccountId === NearConfig.oldRefFinanceToken) {
    token.metadata.symbol = "REF";
    token.metadata.name = "[OLD] Ref Finance Token";
  }
  return token;
};

export const getTokenFetcher = async (_key, tokenAccountId, account) => {
  if (!isValidAccountId(tokenAccountId)) {
    return {
      invalidAccount: true,
    };
  }
  if (tokenAccountId in tokens) {
    return tokens[tokenAccountId];
  }
  const lsKey = LsKey + "tokens:" + tokenAccountId;
  const localToken = ls.get(lsKey);
  const time = new Date().getTime();

  if (!account) {
    return null;
  }

  const contract = {
    balanceOf: async (account, accountId) => {
      return Big(
        await account.near.account.viewFunction(
          tokenAccountId,
          "ft_balance_of",
          {
            account_id: accountId,
          }
        )
      );
    },
    isRegistered: async (account, accountId) =>
      isTokenRegistered(account, tokenAccountId, accountId),
    isWrappedToken: tokenAccountId in WrappedTokens,
    isUnlocked: async (account) => {
      if (WrappedTokens[tokenAccountId] === WrappedTokenType.WrappedNEAR) {
        return true;
      }
      if (WrappedTokens[tokenAccountId] === WrappedTokenType.WrappedFT) {
        const info = await account.near.account.viewFunction(
          tokenAccountId,
          "get_info"
        );
        if (!info) {
          return false;
        }
        return info.status === "Unlocked";
      }
    },
  };

  if (localToken && localToken.expires > time) {
    const token = Object.assign({}, localToken.data, { contract });
    token.totalSupply = Big(token.totalSupply);

    return (tokens[tokenAccountId] = hardcodedMetadata(token, tokenAccountId));
  }
  let token = false;
  try {
    let [metadata, totalSupply] = await Promise.all([
      account.near.account.viewFunction(tokenAccountId, "ft_metadata"),
      account.near.account.viewFunction(tokenAccountId, "ft_total_supply"),
    ]);
    token = hardcodedMetadata(
      {
        contract,
        metadata: keysToCamel(metadata),
        totalSupply: Big(totalSupply),
      },
      tokenAccountId
    );
  } catch (e) {
    const errString = e.message.toString();
    if (errString.indexOf("does not exist while viewing") < 0) {
      console.error(e);
      return false;
    }
    token = {
      notFound: true,
    };
    return (tokens[tokenAccountId] = token);
  }
  ls.set(lsKey, {
    expires: time + TokenExpirationDuration,
    data: Object.assign({}, token, {
      totalSupply: token.totalSupply.toFixed(0),
    }),
  });
  return (tokens[tokenAccountId] = token);
};

export const useToken = (tokenAccountId) => {
  const { data: token } = useSWR(
    ["token_account_id", tokenAccountId, useAccount()],
    getTokenFetcher
  );
  return token;
};
