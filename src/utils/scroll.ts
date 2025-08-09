export function scrollToBottom(el: HTMLElement | null) {
  if (!el) return
  el.scrollTop = el.scrollHeight
}
