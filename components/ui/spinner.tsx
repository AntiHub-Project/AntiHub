import { Loader } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface SpinnerProps {
  size?: string
  color?: string
}

interface SizeProps {
  xs: string
  sm: string
  md: string
  lg: string
  xl: string
}

interface FillProps {
  slate: string
  blue: string
  red: string
  green: string
  white: string
}

interface StrokeProps {
  slate: string
  blue: string
  red: string
  green: string
  white: string
}

const sizesClasses: SizeProps = {
  xs: "w-4 h-4",
  sm: "w-5 h-5",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-10 h-10",
}

const fillClasses = {
  slate: "fill-foreground",
  blue: "fill-blue-500",
  red: "fill-red-500",
  green: "fill-emerald-500",
  white: "fill-background",
} as FillProps

const strokeClasses = {
  slate: "stroke-foreground",
  blue: "stroke-blue-500",
  red: "stroke-red-500",
  green: "stroke-emerald-500",
  white: "stroke-background",
} as StrokeProps

export const Spinner = ({ size = "xs", color = "slate" }: SpinnerProps) => {
  return (
    <div aria-label="Loading..." role="status">
      <Loader
        className={cn(
          "animate-spin",
          sizesClasses[size as keyof SizeProps],
          strokeClasses[color as keyof StrokeProps],
        )}
      />
    </div>
  )
}

export const RoundSpinner = ({
  size = "md",
  color = "slate",
}: SpinnerProps) => {
  return (
    <div aria-label="Loading..." role="status">
      <svg
        className={cn(
          "animate-spin",
          sizesClasses[size as keyof SizeProps],
          fillClasses[color as keyof FillProps],
        )}
        viewBox="3 3 18 18"
      >
        <path
          className="opacity-20"
          d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"
        ></path>
        <path d="M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z"></path>
      </svg>
    </div>
  )
}

interface DotsProps extends SpinnerProps {
  variant?: "v1" | "v2" | "v3" | "v4" | "v5"
}

export const Dots = ({ variant = "v1", ...props }: DotsProps) => {
  switch (variant) {
    case "v1":
      return <Dots_v1 {...props} />
    case "v2":
      return <Dots_v2 {...props} />
    case "v3":
      return <Dots_v3 {...props} />
    case "v4":
      return <Dots_v4 {...props} />
    case "v5":
      return <Dots_v5 {...props} />
    default:
      return <Dots_v1 {...props} />
  }
}

export const Dots_v1 = ({ size, color }: SpinnerProps = {}) => (
  <div className="w-fit">
    <div className="relative flex size-full items-center justify-start">
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.7, repeat: Infinity }}
        className="absolute left-2 top-0 size-3.5 rounded-full bg-current"
      ></motion.span>
      <motion.span
        initial={{ x: 0 }}
        animate={{ x: 24 }}
        transition={{ duration: 0.7, repeat: Infinity }}
        className="absolute left-2 top-0 size-3.5 rounded-full bg-current"
      ></motion.span>
      <motion.span
        initial={{ x: 0 }}
        animate={{ x: 24 }}
        transition={{ duration: 0.7, repeat: Infinity }}
        className="absolute left-8 top-0 size-3.5 rounded-full bg-current"
      ></motion.span>
      <motion.span
        initial={{ scale: 1 }}
        animate={{ scale: 0 }}
        transition={{ duration: 0.7, repeat: Infinity }}
        className="absolute left-14 top-0 size-3.5 rounded-full bg-current"
      ></motion.span>
    </div>
  </div>
)

export const Dots_v2 = ({ size, color }: SpinnerProps = {}) => (
  <div className="flex items-center justify-center ">
    <div className="flex space-x-2">
      <motion.div
        className="size-3.5 rounded-full bg-current"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 1.1,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
      <motion.div
        className="size-3.5 rounded-full bg-current"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 1.1,
          ease: "easeInOut",
          repeat: Infinity,
          delay: 0.3,
        }}
      />
      <motion.div
        className="size-3.5 rounded-full bg-current"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 1.1,
          ease: "easeInOut",
          repeat: Infinity,
          delay: 0.6,
        }}
      />
    </div>
  </div>
)

export const Dots_v3 = ({ size, color }: SpinnerProps = {}) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div className="size-3.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]"></div>
      <div className="size-3.5 animate-bounce rounded-full bg-current [animation-delay:-0.13s]"></div>
      <div className="size-3.5 animate-bounce rounded-full bg-current"></div>
    </div>
  )
}

export const Dots_v4 = ({ size, color }: SpinnerProps = {}) => (
  <div className="flex items-center justify-center space-x-2">
    {[...Array(3)].map((_, index) => (
      <motion.span
        key={index}
        className="size-3.5 rounded-full bg-current"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          delay: index * 0.2,
          duration: 1.2,
          repeat: Infinity,
        }}
      ></motion.span>
    ))}
  </div>
)

export const Dots_v5 = ({ size, color }: SpinnerProps = {}) => {
  const dots = 8
  const radius = 24

  return (
    <div className="relative size-20 border">
      {[...Array(dots)].map((_, i) => {
        const angle = (i / dots) * (2 * Math.PI)
        const x = radius * Math.cos(angle)
        const y = radius * Math.sin(angle)

        return (
          <motion.div
            key={i}
            className="absolute size-2.5 rounded-full bg-current"
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              delay: (i / dots) * 1.7,
              ease: "easeInOut",
            }}
          />
        )
      })}
    </div>
  )
}
