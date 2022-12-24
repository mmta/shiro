import { toast } from 'react-toastify'

export const toastSuccess = s =>
  toast.success(s, {
    position: toast.POSITION.BOTTOM_CENTER
  })

export const toastError = s =>
  toast.error(s, {
    position: toast.POSITION.BOTTOM_CENTER
  })
