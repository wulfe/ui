export function findNextFocusable(allItems, focusableItems, currentIndex, direction) {
    let nextItem = null
    const iterator = direction === 'next' ? 1 : -1
    let nextIndex = currentIndex + iterator

    while (currentIndex < allItems.length) {
        nextItem = allItems[nextIndex] || null

        if (nextItem === null) {
            if (direction === 'next') {
                nextItem = focusableItems[0]
            } else {
                nextItem = focusableItems[focusableItems.length - 1]
            }
            break
        }

        if (! nextItem) {
            return
        }

        if (! nextItem.disabled) {
            break
        }

        nextIndex += iterator
    }

    return nextItem
}
