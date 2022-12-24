import { invoke } from '@tauri-apps/api/tauri'
import { toastError } from './toast'

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export const recoveryFileExist = async () => {
  try {
    return await invoke('recovery_file_exist', {})
  } catch (e) {
    toastError(`Error: ${e}`)
  }
}

export const alertIfConnected = async msg => {
  const on = await isOnline()

  if (on) toastError(msg)
  return on
}

const isOnline = async () => {
  try {
    return await invoke('is_online', {})
  } catch (e) {
    toastError(`Error: ${e}`)
    // assume online on error
    return true
  }
}

export const base64ToArrayBuffer = base64 => {
  const binaryString = window.atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}
