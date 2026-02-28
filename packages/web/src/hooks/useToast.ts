import * as React from 'react'
import type { ToastActionElement, ToastProps } from '@/components/ui/toast'

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type Toast = Omit<ToasterToast, 'id'>

const listeners: Array<(state: ToasterToast[]) => void> = []
let memoryState: ToasterToast[] = []

function dispatch(toasts: ToasterToast[]) {
  memoryState = toasts
  listeners.forEach((listener) => listener(toasts))
}

function toast(props: Toast) {
  const id = genId()
  const newToast: ToasterToast = { id, ...props }
  dispatch([...memoryState, newToast].slice(-TOAST_LIMIT))

  setTimeout(() => {
    dispatch(memoryState.filter((t) => t.id !== id))
  }, TOAST_REMOVE_DELAY)

  return id
}

function useToast() {
  const [toasts, setToasts] = React.useState<ToasterToast[]>(memoryState)

  React.useEffect(() => {
    listeners.push(setToasts)
    return () => {
      const index = listeners.indexOf(setToasts)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  return { toasts, toast }
}

export { useToast, toast }
