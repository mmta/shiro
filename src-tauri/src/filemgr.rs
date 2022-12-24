use std::process::{ Command, Child };
use std::env;
use std::path::Path;
use dirs::home_dir;
use std::fs::create_dir_all;
use anyhow::{ Error, Result, Context };

pub fn open_dir(path: &str, should_open: bool) -> Result<Child> {
    let cmd = match env::consts::OS {
        "windows" => "explorer",
        "macos" => "open",
        "linux" => "xdg-open",
        _ => {
            return Err(Error::msg("cannot determine default file manager for this OS"));
        }
    };

    if !should_open {
        return Err(Error::msg("not opening child process"));
    }

    let child = Command::new(cmd).arg(path).spawn()?;

    Ok(child)
}

pub fn dir_name(file_path: &str) -> Result<&str> {
    // defaults to '.'
    let s = Path::new(file_path)
        .parent()
        .unwrap_or_else(|| Path::new("."))
        .to_str()
        .ok_or_else(|| Error::msg("fail to convert parent directory to str"))?;
    Ok(s)
}

pub fn build_filepath(app_name: &str, file_name: &str, create_dir: bool) -> Result<String> {
    let home = home_dir().ok_or_else(||
        Error::msg("cannot get locate the path for home directory")
    )?;
    let app_dir = Path::new(&home).join(app_name);
    if create_dir {
        create_dir_all(app_dir).context("cannot create folder inside your home directory")?;
    }
    let res = Path::new(&home)
        .join(app_name)
        .join(file_name)
        .into_os_string()
        .into_string()
        .map_err(|_e| Error::msg("cannot convert path to string"))?;
    Ok(res)
}

pub fn path_exist(path: &str) -> Result<bool> {
    Ok(Path::new(path).exists())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_build_filepath() {
        let app = "temp-asdk124k12asc";
        let file_name = "file";
        let target = format!("{}{}{}", app, std::path::MAIN_SEPARATOR, file_name);
        let res = build_filepath(app, "file", true).unwrap();
        assert!(res.contains(&target))
    }

    #[test]
    fn test_path_exist() {
        let exist = env::current_dir().unwrap().into_os_string().into_string().unwrap();
        assert!(path_exist(exist.as_str()).unwrap());
        let doesnt_exist = format!("foo{}1203124asdksakda", std::path::MAIN_SEPARATOR);
        assert!(!path_exist(doesnt_exist.as_str()).unwrap());
    }

    #[test]
    fn test_dir_name() {
        let dir = env::current_dir().unwrap().into_os_string().into_string().unwrap();
        let file_path = format!("{}{}file", dir, std::path::MAIN_SEPARATOR);
        assert_eq!(dir_name(file_path.as_str()).unwrap(), dir.as_str());
    }

    #[test]
    fn test_open_dir() {
        let dir = env::current_dir().unwrap().into_os_string().into_string().unwrap();
        let mut res = open_dir(dir.as_str(), true);
        if let Ok(ref mut child) = res {
            _ = child.kill();
        } else {
            assert_eq!(
                res.unwrap_err().to_string(),
                std::io::Error::from_raw_os_error(2).to_string()
            );
        }
    }
}