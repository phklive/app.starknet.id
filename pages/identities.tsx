import React from "react";
import type { NextPage } from "next";
import styles from "../styles/Home.module.css";
import {
  useAccount,
  useStarknetExecute,
  useTransactionReceipt,
} from "@starknet-react/core";
import { useEffect, useState } from "react";
import IdentitiesGallery from "../components/identities/identitiesGalleryV1";
import MintIdentity from "../components/identities/mintIdentity";
import { useRouter } from "next/router";
import LoadingScreen from "../components/UI/screens/loadingScreen";
import ErrorScreen from "../components/UI/screens/errorScreen";
import SuccessScreen from "../components/UI/screens/successScreen";
import { hexToDecimal } from "../utils/feltService";
import IdentitiesSkeleton from "../components/UI/identitiesSkeleton";

const Identities: NextPage = () => {
  const { address } = useAccount();
  const [loading, setLoading] = useState<boolean>(false)
  const [ownedIdentities, setOwnedIdentities] = useState<FullId[]>([]);
  const [rightTokenId, setRightTokenId] = useState<number | undefined>(
    undefined
  );
  const randomTokenId: number = Math.floor(Math.random() * 1000000000000);
  const router = useRouter();

  //Mint
  const callData = {
    contractAddress: process.env.NEXT_PUBLIC_STARKNETID_CONTRACT as string,
    entrypoint: "mint",
    calldata: [randomTokenId],
  };
  const { execute, data: mintData } = useStarknetExecute({
    calls: callData,
  });

  function mint() {
    execute();
    setRightTokenId(randomTokenId);
  }
  const { data, error: transactionError } = useTransactionReceipt({
    hash: mintData?.transaction_hash,
    watch: true,
  });

  useEffect(() => {
    if (address) {
      // Our Indexer
      setLoading(true)
      fetch(`/api/indexer/addr_to_full_ids?addr=${hexToDecimal(address)}`)
        .then((response) => response.json())
        .then((data) => {
          setOwnedIdentities(data.full_ids);
          setLoading(false)
        });

      // // Aspect Indexer
      // fetch(
      //   `https://api-testnet.aspect.co/api/v0/assets?contract_address=${process.env.NEXT_PUBLIC_STARKNETID_CONTRACT as string}&owner_address=${account.address}&sort_by=minted_at&order_by=desc`
      // )
      //   .then((response) => response.json())
      //   .then((data) => {
      //     setOwnedIdentities(data.assets);
      //   });
    }
  }, [address]);

  return (
    <div className={styles.screen}>
      <div className={styles.firstLeaf}>
        <img width="100%" alt="leaf" src="/leaves/leaf_2.png" />
      </div>
      <div className={styles.secondLeaf}>
        <img width="100%" alt="leaf" src="/leaves/leaf_1.png" />
      </div>

      <div className={styles.container}>
        <>
          {!mintData?.transaction_hash ? (
            <>
              <h1 className="title">Your Starknet identities</h1>
              <div className={styles.containerGallery}>
                {loading ? <IdentitiesSkeleton /> : <IdentitiesGallery identities={ownedIdentities} />}
                <MintIdentity onClick={() => mint()} />
              </div>
            </>
          ) : (
            <>
              {data?.status &&
                !transactionError &&
                !data?.status.includes("ACCEPTED") &&
                data?.status !== "PENDING" && <LoadingScreen />}
              {transactionError && (
                <ErrorScreen
                  onClick={() => router.push("/identities")}
                  buttonText="Retry to mint"
                />
              )}
              {data?.status === "ACCEPTED_ON_L2" ||
                (data?.status === "PENDING" && (
                  <SuccessScreen
                    onClick={() => router.push(`/identities/${rightTokenId}`)}
                    buttonText="See your new identity"
                    successMessage="Congrats, your starknet identity is minted !"
                  />
                ))}
            </>
          )}
        </>
      </div>
    </div>
  );
};

export default Identities;
