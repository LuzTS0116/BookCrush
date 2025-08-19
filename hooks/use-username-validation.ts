import { useState, useCallback, useRef } from 'react'

interface UsernameValidationState {
  isValid: boolean | null
  isChecking: boolean
  error: string | null
  message: string | null
}

interface UsernameValidationResult extends UsernameValidationState {
  validateUsername: (username: string) => void
  resetValidation: () => void
}

export function useUsernameValidation(): UsernameValidationResult {
  const [validationState, setValidationState] = useState<UsernameValidationState>({
    isValid: null,
    isChecking: false,
    error: null,
    message: null
  })

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const performValidation = useCallback(async (usernameToCheck: string) => {
    const trimmed = usernameToCheck.trim()
    
    // Reset state if username is empty
    if (!trimmed) {
      setValidationState({
        isValid: null,
        isChecking: false,
        error: null,
        message: null
      })
      return
    }

    // Client-side validation first
    if (trimmed.length < 3) {
      setValidationState({
        isValid: false,
        isChecking: false,
        error: 'Username must be at least 3 characters long',
        message: null
      })
      return
    }

    if (trimmed.length > 30) {
      setValidationState({
        isValid: false,
        isChecking: false,
        error: 'Username must be less than 30 characters',
        message: null
      })
      return
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
      setValidationState({
        isValid: false,
        isChecking: false,
        error: 'Username can only contain letters, numbers, dots, hyphens, and underscores',
        message: null
      })
      return
    }

    // If client-side validation passes, check with server
    setValidationState(prev => ({
      ...prev,
      isChecking: true,
      error: null,
      message: null
    }))

    try {
      const response = await fetch('/api/profile/check-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: trimmed })
      })

      const data = await response.json()

      if (!response.ok) {
        setValidationState({
          isValid: false,
          isChecking: false,
          error: data.error || 'Failed to check username',
          message: null
        })
        return
      }

      setValidationState({
        isValid: data.available,
        isChecking: false,
        error: data.available ? null : data.message,
        message: data.available ? data.message : null
      })

    } catch (error) {
      console.error('Username validation error:', error)
      setValidationState({
        isValid: false,
        isChecking: false,
        error: 'Network error while checking username',
        message: null
      })
    }
  }, [])

  const validateUsername = useCallback((username: string) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout for debouncing
    timeoutRef.current = setTimeout(() => {
      performValidation(username)
    }, 500)
  }, [performValidation])

  const resetValidation = useCallback(() => {
    // Clear any pending validation
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    setValidationState({
      isValid: null,
      isChecking: false,
      error: null,
      message: null
    })
  }, [])

  return {
    ...validationState,
    validateUsername,
    resetValidation
  }
} 