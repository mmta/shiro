use anyhow::{ Result, Error, format_err, Context };

use bdk::bitcoin::Network;
use bdk::bitcoin::consensus::encode::{ deserialize, serialize_hex, serialize };
use bdk::bitcoin::psbt::PartiallySignedTransaction;
use bdk::database::{ MemoryDatabase };
use bdk::wallet::AddressIndex::New;
use bdk::{
  keys::{
    DerivableKey,
    GeneratableKey,
    GeneratedKey,
    ExtendedKey,
    bip39::{ Mnemonic, WordCount, Language, MnemonicWithPassphrase },
  },
  template::Bip84,
};
use bdk::{ miniscript, Wallet, KeychainKind, SignOptions };

use xyzpub::{ convert_version, Version };

use regex::Regex;

const KEYCHAIN_KIND: KeychainKind = KeychainKind::External;

pub fn generate_mnemonic() -> Result<String> {
  let mnemonic: GeneratedKey<_, miniscript::Segwitv0> = Mnemonic::generate((
    WordCount::Words24,
    Language::English,
  )).map_err(|err| format_err!("{:?}", err))?;
  Ok(mnemonic.to_string())
}

pub fn validate_mnemonic(mnemonic_phrase: &str) -> Result<()> {
  Mnemonic::parse(mnemonic_phrase.trim())?;
  Ok(())
}

fn get_wallet(
  mnemonic_phrase: &str,
  pass: Option<&str>,
  network: Network
) -> Result<Wallet<MemoryDatabase>> {
  // Parse a mnemonic
  let mnemonic = Mnemonic::parse(mnemonic_phrase.trim())?;

  let s = pass.clone().get_or_insert("").to_string();
  let xkey: ExtendedKey = MnemonicWithPassphrase::into_extended_key((mnemonic, Some(s)))?;

  // Get xprv from the extended key
  let xprv = match xkey.into_xprv(network) {
    Some(v) => v,
    None => {
      return Err(Error::msg("unable to derive extended private key"));
    }
  };

  // Create a BDK wallet structure using BIP 84 descriptor ("m/84h/1h/0h/0" and "m/84h/1h/0h/1")
  let wallet = Wallet::new(
    Bip84(xprv, KEYCHAIN_KIND),
    Some(Bip84(xprv, KeychainKind::Internal)),
    network,
    MemoryDatabase::default()
  )?;

  Ok(wallet)
}

pub fn get_segwit_address(seed: &str, pass: Option<&str>, use_mainnet: bool) -> Result<String> {
  let network = if use_mainnet { Network::Bitcoin } else { Network::Testnet };
  let wallet = get_wallet(seed, pass, network)?;
  let addr_info = wallet.get_address(New)?;

  let address = addr_info.address.to_string();
  Ok(address)
}

pub fn get_extended_pubkey(seed: &str, pass: Option<&str>, use_mainnet: bool) -> Result<String> {
  let network = if use_mainnet { Network::Bitcoin } else { Network::Testnet };
  let version = if use_mainnet { &Version::Zpub } else { &Version::Vpub };
  let wallet = get_wallet(seed, pass, network)?;

  let pd = match wallet.public_descriptor(KEYCHAIN_KIND)? {
    Some(v) => v.to_string(),
    None => {
      return Err(Error::msg("unable to obtain the wallet's public descriptor"));
    }
  };

  let re = Regex::new(r"^.+\](\w+)/\d.+$")?;

  let cap = re.captures_iter(pd.as_str()).next();

  if cap.is_none() {
    return Err(Error::msg("unable to get extended public key"));
  }

  let xpub = cap
    .unwrap()
    .get(1)
    .ok_or_else(|| Error::msg("unable to obtain xpub from wallet descriptor"))?
    .as_str();
  let result = convert_version(xpub, version).map_err(|_e|
    Error::msg("unable to convert xpub to zpub")
  )?;
  Ok(result)
}

pub fn sign_psbt(
  seed: &str,
  pass: Option<&str>,
  psbt: &str,
  use_mainnet: bool
) -> Result<(String, String)> {
  let network = if use_mainnet { Network::Bitcoin } else { Network::Testnet };
  let wallet = get_wallet(seed.trim(), pass, network)?;

  // this is required prior to signing
  let _ = wallet.get_address(New)?;

  let mut m_psbt: PartiallySignedTransaction = deserialize(
    &base64::decode(<&str>::clone(&psbt).trim()).context("received invalid base64 data")?
  ).context("received invalid PSBT content")?;

  // to support BlueWallet
  let opts = SignOptions {
    trust_witness_utxo: true,
    ..Default::default()
  };

  let finalize = wallet.sign(&mut m_psbt, opts)?;
  if !finalize {
    return Err(
      Error::msg(
        "unable to finalize transaction, make sure the recovery \
                mnemonic matches the wallet used to create the transaction"
      )
    );
  }

  let signed_tx = serialize_hex(&m_psbt.clone().extract_tx());
  let signed_psbt = base64::encode(serialize(&m_psbt.clone()));

  Ok((signed_tx, signed_psbt))
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_generate_mnemonic() {
    let m = generate_mnemonic().unwrap();
    assert!(validate_mnemonic(&m).is_ok())
  }

  #[test]
  fn test_wallet() {
    // throw away testnet wallet
    let mnemonic =
      "imitate crawl tube spawn gauge stairs balance manage indicate bounce vanish benefit \
             defense excess cinnamon rich layer night tissue patch spring thrive identify limb";
    let passphrase = "foobar";
    let vpub =
      "vpub5YHGQRE2QUjeMkejN3QHQH7qDiCfvcdsP2ywn7pEyLLhr6MJBZF8D1u4RGLDo6rgZ8GrrRgvoWTWJZQp\
            ThHMCdcAtqgVmr3XYqut9sHPPtG";
    let addr = "tb1qn38nc76f8e8qqx0pkfszhkrr50kcylmjsqf0rw";
    let psbt = String::from(
      "cHNidP8BAHEBAAAAAdOSx3x5aAUq6fVDrLhrEFvz5YRfQN/r64ZdX6fSuXZ3AAAAAAD\
            9////AmIXAAAAAAAAFgAUft+jg91vG4hScyH4ELBnzcHhMdkMEgAAAAAAABYAFG/0yJY\
            v5gPoqPXUPlEWGf3s9toXAAAAAAABAR9TLQAAAAAAABYAFJxPPHtJPk4AGeGyYCvYY6P\
            tgn9yAQBxAgAAAAFSgnUqgfDiqpTM+g/o4XogxyjdQsOOkTVM+csFL2L05AEAAAAA/v/\
            //wJTLQAAAAAAABYAFJxPPHtJPk4AGeGyYCvYY6Ptgn9y/fzVAAAAAAAWABTTUii9oRw\
            hIlJmQ7o2L26UJ4MAOjTMJAAiBgMDpfk47LIddD1VmUmfEzQDikHxVdSBasjDUhdgq5G\
            OvBgu1LE7VAAAgAEAAIAAAACAAAAAAAAAAAAAIgIDVJvAb1AN8rNeMOeHPwgzM2tIR3/\
            bMw7ptpG1LDfwCjUYLtSxO1QAAIABAACAAAAAgAAAAAABAAAAACICA9BmuOFPvtSfsrP\
            pxD65c2FGWjZTq/55ajU/91p8toAOGC7UsTtUAACAAQAAgAAAAIABAAAAAAAAAAA="
    );
    let signed_psbt = String::from(
      "cHNidP8BAHEBAAAAAdOSx3x5aAUq6fVDrLhrEFvz5YRfQN/r64ZdX6fSuXZ3AAAAAAD\
            9////AmIXAAAAAAAAFgAUft+jg91vG4hScyH4ELBnzcHhMdkMEgAAAAAAABYAFG/0yJY\
            v5gPoqPXUPlEWGf3s9toXAAAAAAABAHECAAAAAVKCdSqB8OKqlMz6D+jheiDHKN1Cw46\
            RNUz5ywUvYvTkAQAAAAD+////AlMtAAAAAAAAFgAUnE88e0k+TgAZ4bJgK9hjo+2Cf3L\
            9/NUAAAAAABYAFNNSKL2hHCEiUmZDujYvbpQngwA6NMwkAAEBH1MtAAAAAAAAFgAUnE8\
            8e0k+TgAZ4bJgK9hjo+2Cf3IiBgMDpfk47LIddD1VmUmfEzQDikHxVdSBasjDUhdgq5G\
            OvBgu1LE7VAAAgAEAAIAAAACAAAAAAAAAAAABBwABCGsCRzBEAiAkN9Wkt6aihZBN8gy\
            DNmiE8WPTe/XDTYdAYun1qqO07gIgZ7Ryr2MS1TEXVAQcgv/SoT2EWFneryokBvGBDlp\
            QQ10BIQMDpfk47LIddD1VmUmfEzQDikHxVdSBasjDUhdgq5GOvAAiAgNUm8BvUA3ys14\
            w54c/CDMza0hHf9szDum2kbUsN/AKNRgu1LE7VAAAgAEAAIAAAACAAAAAAAEAAAAAIgI\
            D0Ga44U++1J+ys+nEPrlzYUZaNlOr/nlqNT/3Wny2gA4YLtSxO1QAAIABAACAAAAAgAE\
            AAAAAAAAAAA=="
    );
    let signed_tx = String::from(
      "01000000000101d392c77c7968052ae9f543acb86b105bf3e5845f40dfebeb865d5\
            fa7d2b976770000000000fdffffff0262170000000000001600147edfa383dd6f1b8\
            8527321f810b067cdc1e131d90c120000000000001600146ff4c8962fe603e8a8f5d\
            43e511619fdecf6da170247304402202437d5a4b7a6a285904df20c83366884f163d\
            37bf5c34d874062e9f5aaa3b4ee022067b472af6312d5311754041c82ffd2a13d845\
            859deaf2a2406f1810e5a50435d01210303a5f938ecb21d743d5599499f1334038a4\
            1f155d4816ac8c3521760ab918ebc00000000"
    );
    let res = get_extended_pubkey(mnemonic, Some(passphrase), false);
    assert!(res.is_ok(), "{:?}", res);
    assert_eq!(res.unwrap(), vpub);
    let res = get_extended_pubkey(mnemonic, Some(passphrase), true);
    assert_ne!(res.unwrap(), vpub);

    let res = get_segwit_address(mnemonic, Some(passphrase), false);
    assert!(res.is_ok(), "{:?}", res);
    assert_eq!(res.unwrap(), addr);
    let res = get_segwit_address(mnemonic, Some(passphrase), true);
    assert_ne!(res.unwrap(), addr);

    let res = sign_psbt(mnemonic, Some(passphrase), psbt.as_str(), true);
    assert!(res.is_err(), "{:?}", res);

    let res = sign_psbt(mnemonic, Some(passphrase), psbt.as_str(), false);
    assert!(res.is_ok(), "{:?}", res);
    let (res_tx, res_psbt) = res.unwrap();
    assert_eq!(res_tx, signed_tx);
    assert_eq!(res_psbt, signed_psbt);
  }
}
