use std::time::Duration;
use anyhow::{ Result, Error };
use tokio::sync::mpsc;
use reqwest::Client;
use tokio::sync::mpsc::error::SendError;

static SECONDS: u64 = 2;

pub async fn is_online(urls_to_check: Option<Vec<String>>) -> Result<bool> {
  let urls = if urls_to_check.is_some() {
    urls_to_check.unwrap()
  } else {
    vec![
      String::from("https://www.google.com/"),
      String::from("https://www.microsoft.com/"),
      String::from("https://bitcoin.org/")
    ]
  };

  web_reachable(urls, SECONDS, false).await
}

async fn web_reachable(urls: Vec<String>, timeout_seconds: u64, verbose: bool) -> Result<bool> {
  let client = Client::new();
  let (tx, mut rx) = mpsc::unbounded_channel();

  let mut count = 0;
  for line in urls {
    let client = client.clone();
    let tx = tx.clone();
    tokio::spawn(async move {
      let req = client.get(&line).send();

      match tokio::time::timeout(Duration::from_secs(timeout_seconds), req).await {
        Ok(r) => {
          // errors caused by incorrect usage of reqwest (i.e. invalid web url, failed dns lookup) are here

          _ = r
            .map(|r| {
              let status = r.status().as_u16();
              if verbose {
                println!("http result: {}, {}", line, status);
              }
              _ = tx.send(Result::Ok("reachable")).map_err(send_error_handler);
            })
            .map_err(|e| {
              // return and assume network is connected if this is due to incorrect URLs,
              // or due to something we received from remote
              if e.is_builder() || e.is_body() || e.is_decode() || e.is_status() || e.is_redirect() {
                if verbose {
                  println!("incorrect reqwest setup or server error: {}, {}", line, e);
                }
                return;
              }
              // else it's either e.is_request() and/or e.is_connect(), which include DNS related error,
              // or e.is_timeout()
              println!("is_request: {}", e.is_request());
              println!("is_connect: {}", e.is_connect());
              println!("is_timeout: {}", e.is_timeout());
              if verbose {
                println!("likely error because of the network is disconnected: {}, {}", line, e);
              }
              _ = tx.send(Result::Err("likely unreachable")).map_err(send_error_handler);
            });
        }
        Err(e) => {
          if verbose {
            println!("timeout reached: {}, {}", line, e);
          }
          _ = tx.send(Result::Err("foo bar")).map_err(send_error_handler);
        }
      }
    });
    count += 1;
  }

  // Drop the sending side, so that we get a None when calling rx.recv() one final time
  std::mem::drop(tx);

  let mut i = 0;
  loop {
    match rx.recv().await {
      None => {
        if i != count {
          println!("count and i: {} {}", count, i);
          break Err(Error::msg("cannot check network connection, likely due to incorrect URLs"));
        }
        // All senders are gone, which must mean that
        // we're at the end of our loop, i.e. all URLs have timed out or err'd.
        if verbose {
          println!("network is disconnected!");
        }
        break Ok(false);
      }
      // One of the URL is alive, that's enough to conclude that we're online
      Some(Ok(_)) => {
        assert!(i < count);
        if verbose {
          println!("network is connected!");
        }
        break Ok(true);
      }
      // Timeout reached and any other errors are considered disconnected
      // and should wait for all URLs to be processed
      Some(Err(e)) => {
        assert!(i < count);
        if verbose {
          println!("Assuming unreachable, error received: {:?}", e.to_string());
        }
      }
    }
    i += 1;
  }
}

fn send_error_handler(e: SendError<Result<&str, &str>>) -> String {
  e.to_string()
}

#[cfg(test)]
mod tests {
  use super::*;
  const TESTING_SECONDS: u64 = 5;

  #[tokio::test]
  async fn test_is_online() {
    let res = is_online(None).await;
    assert!(res.unwrap());
    let v = vec![String::from("https://www.wikipedia.org")];
    let res = is_online(Some(v)).await;
    assert!(res.unwrap(), "expected to successfully connect");
  }

  #[tokio::test]
  async fn test_connected_but_err() {
    let v = vec![String::from("https://www.wikipedia.org/askdalskdlakdlad")];
    let res = web_reachable(v, TESTING_SECONDS, true).await;
    assert!(res.unwrap(), "expected to successfully connect - this should only gives 404");
  }

  #[tokio::test]
  async fn test_incorrect_urls() {
    let urls = vec![String::from("smtp://gmail")];
    let e = web_reachable(urls, TESTING_SECONDS, true).await;
    assert_eq!(
      e.unwrap_err().to_string(),
      "cannot check network connection, likely due to incorrect URLs"
    );
  }

  #[tokio::test]
  async fn test_disconnected() {
    let urls = vec![String::from("https://www.apple.com:666")];
    let res = web_reachable(urls, TESTING_SECONDS, true).await;
    assert!(!res.unwrap(), "this should trigger a timeout");
  }

  #[test]
  fn test_send_error_handler() {
    assert_eq!(send_error_handler(SendError(Ok("abc"))), "channel closed")
  }
}
