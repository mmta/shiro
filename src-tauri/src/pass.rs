use zxcvbn::zxcvbn;

use random_string::generate;

use anyhow::{ Result, Error };

const MIN_STRENGTH: u8 = 4;
const WORDS: usize = 6;

fn get_six_words() -> Option<String> {
    let p1 = passphrase_lib::gen_passphrase();
    let p2 = passphrase_lib::gen_passphrase();
    let binding = [p1, p2].join(" ");
    let r = binding.split_whitespace().take(WORDS).collect::<Vec<&str>>();
    let mut s = r.clone();
    s.sort();
    s.dedup();
    if r.len() != s.len() {
        return None;
    }
    Some(r.join(" "))
}

pub fn generate_passphrase() -> Result<String> {
    let pass;
    loop {
        let res = get_six_words();
        if let Some(s) = res {
            pass = s;
            break;
        }
    }
    is_strong(pass.as_str())?;
    Ok(pass)
}

pub fn is_strong(pass: &str) -> Result<()> {
    let estimate = zxcvbn(pass, &[])?;
    let score = estimate.score();
    if score < MIN_STRENGTH {
        return Err(
            Error::msg(
                format!(
                    "failed to generate strong passphrase, score is {} ({} is required) ",
                    score,
                    MIN_STRENGTH
                )
            )
        );
    }
    Ok(())
}

pub fn generate_password() -> Result<String> {
    let pass: String;
    loop {
        let p = &generate_passphrase()?.replace(' ', "")[..11];
        let num = generate(1, "1234567890");
        let sym = generate(1, "!@#$%^&*()-+=:;<>/\\?{}[].");
        let s = format!("{}{}{}", p, num, sym);
        if is_strong(s.as_str()).is_ok() {
            pass = s;
            break;
        }
    }

    Ok(pass)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_strong() {
        assert!(is_strong("abc").is_err());
        assert!(is_strong("12345").is_err());
        assert!(is_strong("mdvfm22ks.ahsad1").is_ok());
    }

    #[test]
    fn test_generate_password() {
        let p = generate_password().unwrap();
        assert!(p.len() > 12);
        assert!(is_strong(p.as_str()).is_ok());
    }

    #[test]
    fn test_generate_passphrase() {
        let p = generate_passphrase().unwrap();
        let c = p.matches(' ').count();
        assert!(c == 5);
        assert!(p.len() > 20);
        assert!(is_strong(p.as_str()).is_ok());
    }
}