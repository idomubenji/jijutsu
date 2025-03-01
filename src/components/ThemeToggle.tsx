import * as React from "react"
import { Moon, Sun, Loader2 } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle({ className, ...props }: React.ComponentPropsWithoutRef<typeof Button>) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [isChanging, setIsChanging] = React.useState(false)

  // After mounting, we have access to the theme
  React.useEffect(() => setMounted(true), [])

  const handleThemeChange = () => {
    setIsChanging(true)
    // Short delay to show loading animation
    setTimeout(() => {
      setTheme(resolvedTheme === "dark" ? "light" : "dark")
      setTimeout(() => {
        setIsChanging(false)
      }, 300) // Wait a bit longer after theme change to ensure DOM updates
    }, 200)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleThemeChange}
      disabled={!mounted || isChanging}
      className={`h-9 w-9 rounded-full p-0 text-gray-200 hover:text-white dark:text-gray-700 dark:hover:text-gray-900 ${className}`}
      {...props}
    >
      {!mounted || isChanging ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          <Sun className="h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <Moon className="absolute h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        </>
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
} 