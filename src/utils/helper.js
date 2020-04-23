export function flattenArr (arr) {
  return arr.reduce((a, b) => {
    a[b.id] = b
    return a
  }, {})
}

export function objToArr (obj) {
  return Object.values(obj)
}

export const timestampToString = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

export const getParentNode = (node, parentClassName) => {
  let current = node
  while(current !== null) {
    if (current.classList.contains(parentClassName)) {
      return current
    }
    current = current.parentNode
  }
  return false
}