
import html2canvas from 'html2canvas'

/**
 * Captures a DOM element as a high-quality JPEG and shares or downloads it.
 * Uses html2canvas for better compatibility with external images and CORS.
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

    // 2. Expand the element to its full scroll height for capture
    // This ensures we get the full list even if it's scrollable
    const scrollContainer = node.querySelector('.overflow-y-auto') as HTMLElement

    if (scrollContainer) {
      scrollContainer.style.height = 'auto'
      scrollContainer.style.maxHeight = 'none'
      scrollContainer.style.overflow = 'visible'
    }

    node.style.height = 'auto'
    node.style.maxHeight = 'none'
    node.style.overflow = 'visible'

    // 3. Generate Canvas
    const canvas = await html2canvas(node, {
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#f8fafc',
      scale: 2, // Higher resolution
      logging: false,
      onclone: (clonedDoc) => {
        // Additional tweaks to the cloned element before capture
        const clonedNode = clonedDoc.getElementById(elementId)
        if (clonedNode) {
          clonedNode.style.borderRadius = '0'
        }
      }
    })

    // 4. Restore original styles immediately
    node.style.cssText = originalStyle
    if (scrollContainer) {
      scrollContainer.style.height = ''
      scrollContainer.style.maxHeight = ''
      scrollContainer.style.overflow = ''
    }

    // 5. Convert to Data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95)

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
    alert('Could not generate image. Please check your internet connection or try a different browser.')
  }
}
