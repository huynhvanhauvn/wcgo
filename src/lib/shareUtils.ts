
import { toJpeg } from 'html-to-image'

/**
 * Captures a DOM element as a high-quality JPEG and shares or downloads it.
 * Handles long scrollable lists by temporarily expanding them.
 */
export async function captureAndShare(elementId: string, fileName: string) {
  const node = document.getElementById(elementId)
  if (!node) {
    console.error('Element not found:', elementId)
    return
  }

  try {
    // 1. Store original styles to restore later
    const originalStyle = node.style.cssText
    const originalHeight = node.style.height
    const originalMaxHeight = node.style.maxHeight
    const originalOverflow = node.style.overflow

    // 2. Find the scrollable container inside if any, or use the node itself
    // For our app, modals and cards usually have an overflow-y-auto section
    const scrollContainer = node.querySelector('.overflow-y-auto') as HTMLElement || node

    // 3. Expand the element to its full scroll height for capture
    // This ensures we get the full list even if it's scrollable
    if (scrollContainer !== node) {
      scrollContainer.style.height = 'auto'
      scrollContainer.style.maxHeight = 'none'
      scrollContainer.style.overflow = 'visible'
    }

    node.style.height = 'auto'
    node.style.maxHeight = 'none'
    node.style.overflow = 'visible'

    // 4. Generate Image
    // Use a slight delay to ensure browser repaints the expanded layout
    await new Promise(resolve => setTimeout(resolve, 100))

    const dataUrl = await toJpeg(node, {
      quality: 0.95,
      backgroundColor: '#f8fafc', // Matches app slate-50
      style: {
        borderRadius: '0',
      },
      // Ensure we capture the full expanded height
      height: node.scrollHeight,
      width: node.scrollWidth,
    })

    // 5. Restore original styles immediately
    node.style.cssText = originalStyle
    if (scrollContainer !== node) {
      scrollContainer.style.height = ''
      scrollContainer.style.maxHeight = ''
      scrollContainer.style.overflow = ''
    }

    // 6. Share or Download
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], `${fileName}.jpg`, { type: 'image/jpeg' })

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'World Cup 2026 Arena',
        text: 'Check out the latest updates from the Arena!',
      })
    } else {
      // Fallback: Download for Desktop
      const link = document.createElement('a')
      link.download = `${fileName}.jpg`
      link.href = dataUrl
      link.click()
    }
  } catch (error) {
    console.error('Sharing failed:', error)
    alert('Could not generate image. Please try again.')
  }
}
