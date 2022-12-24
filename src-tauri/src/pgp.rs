use std::{ io::{ Write, Read }, fs::{ OpenOptions, self } };
use std::panic::catch_unwind;

use anyhow::{ Context, Result, Error };
use sequoia_openpgp::{
    armor,
    serialize::stream::{ Message, Encryptor, Compressor, LiteralWriter, Armorer },
    types::{ CompressionAlgorithm, SymmetricAlgorithm },
    Cert,
    KeyHandle,
    packet::{ SKESK, PKESK },
    Fingerprint,
    policy::StandardPolicy,
    parse::{
        stream::{
            DecryptorBuilder,
            VerificationHelper,
            MessageStructure,
            DecryptionHelper,
            Decryptor,
        },
        Parse,
    },
    crypto::{ SessionKey },
};

pub fn encrypt_string(file_name: &str, passphrase: &str, text: &str) -> Result<()> {
    let output = create_pgp(file_name, false)?;

    let mut message = Encryptor::with_passwords(output, Some(passphrase))
        .symmetric_algo(SymmetricAlgorithm::AES256)
        .build()
        .context("cannot setup encryptor")?;

    message = Compressor::new(message)
        .algo(CompressionAlgorithm::Zip)
        .build()
        .context("cannot setup compressor")?;

    let mut lw = LiteralWriter::new(message).build().context("cannot setup literal writer")?;

    lw.write_all(text.as_bytes()).context("cannot copy the text into writer")?;
    lw.finalize().context("cannot finalize the writer")?;
    Ok(())
}

fn create_pgp(file_path: &str, binary: bool) -> Result<Message> {
    let b = Box::new(
        OpenOptions::new()
            .write(true)
            .truncate(true)
            .create(true)
            .open(file_path)
            .context("Failed to create output file")?
    );
    let mut message = Message::new(b);
    if !binary {
        message = Armorer::new(message).kind(armor::Kind::Message).build()?;
    }
    Ok(message)
}

struct Helper<'a> {
    passphrase: &'a str,
}

impl VerificationHelper for Helper<'_> {
    fn get_certs(&mut self, _ids: &[KeyHandle]) -> Result<Vec<Cert>> {
        Ok(Vec::new()) // Feed the Certs to the verifier here...
    }
    fn check(&mut self, _structure: MessageStructure) -> Result<()> {
        Ok(()) // Implement your verification policy here.
    }
}

impl DecryptionHelper for Helper<'_> {
    fn decrypt<D>(
        &mut self,
        _: &[PKESK],
        skesks: &[SKESK],
        _sym_algo: Option<SymmetricAlgorithm>,
        mut decrypt: D
    ) -> Result<Option<Fingerprint>>
        where D: FnMut(SymmetricAlgorithm, &SessionKey) -> bool
    {
        _ = skesks[0]
            .decrypt(&self.passphrase.into())
            .map(|(algo, session_key)| decrypt(algo, &session_key))?;
        Ok(None)
    }
}

pub fn decrypt_file(file_name: &str, passphrase: &str) -> Result<String> {
    let h = Helper { passphrase };

    let p = &StandardPolicy::new();

    let data = fs::read(file_name).context("fail to open GPG file")?;

    // from_bytes() below will panic on invalid pgp file content
    let mut v = catch_unwind(
        || -> Decryptor<Helper> {
            return DecryptorBuilder::from_bytes(&data).unwrap().with_policy(p, None, h).unwrap();
        }
    ).map_err(|_e|
        Error::msg("cannot create a decryptor, likely wrong passphrase or corrupt GPG file content")
    )?;

    let mut content = Vec::new();
    v.read_to_end(&mut content)?;
    let s = String::from_utf8(content).context("cannot parse content as utf-8")?;
    Ok(s)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encrypt_decrypt_file() {
        let passphrase = "abcde";
        let text = "super secret";
        let file_name = std::env
            ::temp_dir()
            .join("tmp.gpg")
            .into_os_string()
            .into_string()
            .unwrap();
        scopeguard::defer! {
            _ = fs::remove_file(file_name.as_str());
        }
        let enc_res = encrypt_string(file_name.as_str(), passphrase, text);
        assert!(enc_res.is_ok(), "unable to encrypt");
        let dec_res = decrypt_file(file_name.as_str(), "fghij");
        assert!(dec_res.is_err(), "wrong password shouldnt decrypt");
        let dec_res = decrypt_file(file_name.as_str(), passphrase);
        assert!(dec_res.is_ok(), "unable to decrypt");
        assert!(dec_res.unwrap() == text, "incorrect decryption result")
    }
}