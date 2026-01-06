import { useState, useEffect } from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Set the initial value after the component mounts
    checkDevice()

    window.addEventListener("resize", checkDevice)

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", checkDevice)
  }, [])

  return isMobile
}
