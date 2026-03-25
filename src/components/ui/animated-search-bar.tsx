"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import clsx from "clsx"
import styles from "./animated-search-bar.module.css"

/* ─── SVG Filter (efeito gooey) ─── */
const GooeyFilter = () => (
  <svg aria-hidden="true">
    <defs>
      <filter id="goo-effect">
        <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -15"
          result="goo"
        />
        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
      </filter>
    </defs>
  </svg>
)

/* ─── Ícone de busca animado ─── */
const SearchIcon = ({ isUnsupported }: { isUnsupported: boolean }) => (
  <motion.svg
    initial={{
      opacity: 0,
      scale: 0.8,
      x: -4,
      filter: isUnsupported ? "none" : "blur(5px)",
    }}
    animate={{ opacity: 1, scale: 1, x: 0, filter: "blur(0px)" }}
    exit={{
      opacity: 0,
      scale: 0.8,
      x: -4,
      filter: isUnsupported ? "none" : "blur(5px)",
    }}
    transition={{ delay: 0.1, duration: 1, type: "spring", bounce: 0.15 }}
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </motion.svg>
)

/* ─── Ícone de loading ─── */
const LoadingIcon = () => (
  <svg
    className={styles.loadingIcon}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    aria-label="Carregando"
    role="status"
  >
    <rect width="256" height="256" fill="none" />
    {[
      { x1: 128, y1: 32, x2: 128, y2: 64 },
      { x1: 195.88, y1: 60.12, x2: 173.25, y2: 82.75 },
      { x1: 224, y1: 128, x2: 192, y2: 128 },
      { x1: 195.88, y1: 195.88, x2: 173.25, y2: 173.25 },
      { x1: 128, y1: 224, x2: 128, y2: 192 },
      { x1: 60.12, y1: 195.88, x2: 82.75, y2: 173.25 },
      { x1: 32, y1: 128, x2: 64, y2: 128 },
      { x1: 60.12, y1: 60.12, x2: 82.75, y2: 82.75 },
    ].map((line, i) => (
      <line
        key={i}
        {...line}
        fill="none"
        stroke="#dddddd"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
    ))}
  </svg>
)

/* ─── Variantes de animação ─── */
const buttonVariants = {
  initial: { x: 0, width: 100 },
  step1: { x: 0, width: 100 },
  step2: { x: -30, width: 240 },
}

const iconVariants = {
  hidden: { x: -50, opacity: 0 },
  visible: { x: 16, opacity: 1 },
}

/* ─── Detecção de browser sem suporte ao goo ─── */
export const isUnsupportedBrowser = () => {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent.toLowerCase()
  const isSafari =
    ua.includes("safari") &&
    !ua.includes("chrome") &&
    !ua.includes("chromium") &&
    !ua.includes("android") &&
    !ua.includes("firefox")
  const isChromeOniOS = ua.includes("crios")
  return isSafari || isChromeOniOS
}

/* ─── Props ─── */
interface GooeySearchBarProps {
  /** Valor controlado externamente */
  value?: string
  /** Callback quando o valor muda */
  onChange?: (value: string) => void
  /** Placeholder do input */
  placeholder?: string
  /** Se está carregando */
  isLoading?: boolean
}

/* ─── Componente Principal ─── */
export function GooeySearchBar({
  value: controlledValue,
  onChange,
  placeholder = "Buscar...",
  isLoading: externalLoading,
}: GooeySearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState<1 | 2>(1)
  const [internalValue, setInternalValue] = useState("")
  const isUnsupported = useMemo(() => isUnsupportedBrowser(), [])

  const isControlled = controlledValue !== undefined
  const displayValue = isControlled ? controlledValue : internalValue
  const isLoading = externalLoading ?? false

  const handleButtonClick = useCallback(() => {
    setStep(2)
  }, [])

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      if (isControlled) {
        onChange?.(val)
      } else {
        setInternalValue(val)
        onChange?.(val)
      }
    },
    [isControlled, onChange]
  )

  // Foca no input ao expandir
  useEffect(() => {
    if (step === 2) {
      inputRef.current?.focus()
    } else {
      if (!isControlled) setInternalValue("")
      onChange?.("")
    }
  }, [step, isControlled, onChange])

  // Fecha ao clicar fora
  useEffect(() => {
    if (step !== 2) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setStep(1)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [step])

  // Fecha com Escape
  useEffect(() => {
    if (step !== 2) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setStep(1)
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [step])

  return (
    <div
      ref={wrapperRef}
      className={clsx(styles.wrapper, isUnsupported && styles.noGoo)}
    >
      <GooeyFilter />

      <div className={styles.buttonContent}>
        <motion.div
          className={styles.buttonContentInner}
          initial="initial"
          animate={step === 1 ? "step1" : "step2"}
          transition={{ duration: 0.75, type: "spring", bounce: 0.15 }}
        >
          <motion.div
            variants={buttonVariants}
            onClick={handleButtonClick}
            whileHover={{ scale: step === 2 ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={styles.searchBtn}
            role="button"
            aria-label="Abrir busca"
          >
            {step === 1 ? (
              <span className={styles.searchText}>Search</span>
            ) : (
              <input
                ref={inputRef}
                type="text"
                className={styles.searchInput}
                placeholder={placeholder}
                aria-label="Campo de busca"
                value={displayValue}
                onChange={handleSearch}
              />
            )}
          </motion.div>

          <AnimatePresence mode="wait">
            {step === 2 && (
              <motion.div
                key="icon"
                className={styles.separateElement}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={iconVariants}
                transition={{
                  delay: 0.1,
                  duration: 0.85,
                  type: "spring",
                  bounce: 0.15,
                }}
              >
                {!isLoading ? (
                  <SearchIcon isUnsupported={isUnsupported} />
                ) : (
                  <LoadingIcon />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
