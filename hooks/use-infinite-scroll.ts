import { useEffect, useCallback } from 'react'

interface UseInfiniteScrollProps {
  enabled: boolean
  onLoadMore: () => void
  threshold?: number
}

export function useInfiniteScroll({ 
  enabled, 
  onLoadMore, 
  threshold = 200 
}: UseInfiniteScrollProps) {
  const handleScroll = useCallback(() => {
    if (!enabled) return

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    
    const nearBottom = scrollTop + windowHeight >= documentHeight - threshold
    
    if (nearBottom) {
      onLoadMore()
    }
  }, [enabled, onLoadMore, threshold])

  const throttledHandleScroll = useCallback(
    throttle(handleScroll, 200),
    [handleScroll]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('scroll', throttledHandleScroll)
    
    return () => window.removeEventListener('scroll', throttledHandleScroll)
  }, [enabled, throttledHandleScroll])
}

// Simple throttle function
function throttle(func: Function, delay: number) {
  let timeoutId: NodeJS.Timeout
  let lastExecTime = 0
  
  return function (...args: any[]) {
    const currentTime = Date.now()
    
    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func(...args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }
} 