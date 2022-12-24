#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

use anyhow::Error;
use tauri::{ Size, LogicalSize, Manager };

mod pass;
mod filemgr;
mod wallet;
mod pgp;
mod conn;

static SEED_FILE: &str = "recovery.txt.gpg";
static APP_NAME: &str = "shiro";

fn stringify_err(e: anyhow::Error) -> String {
    // println!("Error: {:?}", e);
    format!("{:#}", e)
}

fn get_gpg_fpath() -> Result<String, String> {
    let res = filemgr::build_filepath(APP_NAME, SEED_FILE, true).map_err(stringify_err)?;
    Ok(res)
}

#[tauri::command]
fn recovery_file_exist() -> Result<(bool, String), String> {
    let s = filemgr::build_filepath(APP_NAME, SEED_FILE, false).map_err(stringify_err)?;
    let res = filemgr::path_exist(&s).map_err(stringify_err)?;
    Ok((res, s))
}

#[tauri::command]
fn is_strong_passphrase(pass: &str) -> Result<(), String> {
    pass::is_strong(pass).map_err(stringify_err)?;
    Ok(())
}

#[tauri::command]
async fn is_online() -> Result<bool, String> {
    let res = conn::is_online(None).await.map_err(stringify_err)?;
    Ok(res)
}

#[tauri::command]
fn generate_passphrase() -> Result<String, String> {
    let res = pass::generate_passphrase().map_err(stringify_err)?;
    Ok(res)
}

#[tauri::command]
fn generate_password() -> Result<String, String> {
    let res = pass::generate_password().map_err(stringify_err)?;
    Ok(res)
}

#[tauri::command]
fn generate_mnemonic() -> Result<String, String> {
    let res = wallet::generate_mnemonic().map_err(stringify_err)?;
    Ok(res)
}

#[tauri::command]
fn explore(should_open: bool) -> Result<(), String> {
    let binding = get_gpg_fpath()?;
    let full_path = binding.as_str();
    let dir_name = filemgr::dir_name(full_path).map_err(stringify_err)?;
    filemgr::open_dir(dir_name, should_open).map_err(stringify_err)?;
    Ok(())
}

#[tauri::command]
fn encrypt(passphrase: &str, text: &str) -> Result<(), String> {
    let v: Vec<&str> = text.split(" :: ").collect();
    if v.len() != 2 {
        return Err(stringify_err(Error::msg("invalid text format")));
    }
    wallet::validate_mnemonic(v[0]).map_err(stringify_err)?;

    pgp::encrypt_string(get_gpg_fpath()?.as_str(), passphrase, text).map_err(stringify_err)?;
    Ok(())
}

#[tauri::command]
fn decrypt(passphrase: &str) -> Result<String, String> {
    let res = pgp::decrypt_file(get_gpg_fpath()?.as_str(), passphrase).map_err(stringify_err)?;
    Ok(res)
}

fn read_split_secrets(passphrase: &str) -> Result<(String, String), String> {
    let text = pgp::decrypt_file(get_gpg_fpath()?.as_str(), passphrase).map_err(stringify_err)?;
    let v: Vec<&str> = text.split(" :: ").collect();
    if v.len() != 2 {
        return Err(
            stringify_err(
                Error::msg(
                    "the recovery file contains invalid data! it should be in a form of recovery phrase :: passphrase"
                )
            )
        );
    }
    Ok((String::from(v[0]), String::from(v[1])))
}

#[tauri::command]
fn sign_psbt(passphrase: &str, psbt: &str) -> Result<(String, String), String> {
    let (seed, bip_passphrase) = read_split_secrets(passphrase)?;
    let res = wallet
        ::sign_psbt(seed.as_str(), Some(&bip_passphrase), psbt, true)
        .map_err(stringify_err)?;
    Ok(res)
}

#[tauri::command]
fn decrypt_and_get_addresses(passphrase: &str) -> Result<(String, String), String> {
    let (seed, bip_passphrase) = read_split_secrets(passphrase)?;
    let zpub = wallet
        ::get_extended_pubkey(seed.as_str(), Some(bip_passphrase.as_str()), true)
        .map_err(stringify_err)?;
    let addr = wallet
        ::get_segwit_address(seed.as_str(), Some(bip_passphrase.as_str()), true)
        .map_err(stringify_err)?;

    Ok((zpub, addr))
}

fn main() {
    let res = tauri_builder().run(tauri::generate_context!());
    if let Err(e) = res {
        println!("Error occurred: {}", e)
    }
}

fn tauri_builder() -> tauri::Builder<tauri::Wry> {
    tauri::Builder
        ::default()

        .setup(|app| {
            let matches = app.get_cli_matches()?;
            let signer_arg = matches.args.get(&String::from("signer"));
            if signer_arg.is_none() {
                return Ok(());
            }
            if signer_arg.unwrap().occurrences > 0 {
                let main_window = app.get_window("main");
                if let Some(w) = main_window {
                    _ = w.set_size(Size::Logical(LogicalSize { width: 1050.0, height: 800.0 }));
                }
            }
            Ok(())
        })
        .invoke_handler(
            tauri::generate_handler![
                is_online,
                encrypt,
                decrypt,
                generate_passphrase,
                generate_password,
                generate_mnemonic,
                explore,
                sign_psbt,
                decrypt_and_get_addresses,
                is_strong_passphrase,
                recovery_file_exist
            ]
        )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tauri_builder() {
        let b = Some(tauri_builder());
        assert!(b.is_some())
    }

    #[test]
    fn test_lifecycle() {
        let mnemonic = generate_mnemonic().unwrap();
        let passphrase = generate_passphrase().unwrap();
        let password = generate_password().unwrap();

        assert!(is_strong_passphrase(password.as_str()).is_ok());

        let res = encrypt(passphrase.as_str(), "wrong fmt");
        assert!(res.is_err());
        let text = format!("{} :: {}", mnemonic, password);
        let res = encrypt(passphrase.as_str(), text.as_str());
        assert!(res.is_ok());

        let res = decrypt(passphrase.as_str());
        assert!(res.is_ok());

        assert!(recovery_file_exist().is_ok());

        let res = decrypt_and_get_addresses(passphrase.as_str());
        assert!(res.is_ok());

        let res = sign_psbt(passphrase.as_str(), "random");
        assert!(res.is_err());

        let res = pgp::encrypt_string(
            get_gpg_fpath().unwrap().as_str(),
            passphrase.as_str(),
            "wrong data"
        );
        assert!(res.is_ok());
        let res = decrypt_and_get_addresses(passphrase.as_str());
        assert!(res.is_err());
    }

    #[tokio::test]
    async fn test_is_online() {
        let res = is_online().await;
        assert!(res.is_ok());
    }
    #[test]
    fn test_explore() {
        if let Err(res) = explore(false) {
            assert!(
                res == std::io::Error::from_raw_os_error(2).to_string() ||
                    res == "not opening child process"
            );
        }
    }
}