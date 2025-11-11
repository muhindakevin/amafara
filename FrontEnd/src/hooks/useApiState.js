import { useEffect, useState } from 'react'

export default function useApiState(initialValue) {
  const [data, setData] = useState(initialValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const wrap = async (fn) => {
    try {
      setLoading(true)
      setError(null)
      const result = await fn()
      return result
    } catch (e) {
      setError(e)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { data, setData, loading, setLoading, error, setError, wrap }
}


