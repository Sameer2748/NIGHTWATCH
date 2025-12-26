"use client"

import { useEffect, useRef } from "react"
import type React from "react"
import { useInView } from "motion/react"
import { annotate } from "rough-notation"
import { type RoughAnnotation } from "rough-notation/lib/model"
import { useTheme } from '@/lib/theme/ThemeContext';

type AnnotationAction =
    | "highlight"
    | "underline"
    | "box"
    | "circle"
    | "strike-through"
    | "crossed-off"
    | "bracket"

interface HighlighterProps {
    children: React.ReactNode
    action?: AnnotationAction
    color?: string
    strokeWidth?: number
    animationDuration?: number
    iterations?: number
    padding?: number
    multiline?: boolean
    isView?: boolean
    textColor?: string
}

export function Highlighter({
    children,
    action = "highlight",
    color = "#e0715594",
    strokeWidth = 1.5,
    animationDuration = 1000,
    iterations = 2,
    padding = 2,
    multiline = true,
    isView = false,
    textColor = "black"
}: HighlighterProps) {
      const { theme, toggleTheme } = useTheme();
    const elementRef = useRef<HTMLSpanElement>(null)
    const annotationRef = useRef<RoughAnnotation | null>(null)

    const isInView = useInView(elementRef, {
        once: true,
        margin: "-10%",
    })

    // If isView is false, always show. If isView is true, wait for inView
    const shouldShow = !isView || isInView

    useEffect(() => {
        if (!shouldShow) return

        const element = elementRef.current
        if (!element) return

        const annotationConfig = {
            type: action,
            color,
            strokeWidth,
            animationDuration,
            iterations,
            padding,
            multiline,
        }

        const annotation = annotate(element, annotationConfig)

        annotationRef.current = annotation
        annotationRef.current.show()

        const resizeObserver = new ResizeObserver(() => {
            annotation.hide()
            annotation.show()
        })

        resizeObserver.observe(element)
        resizeObserver.observe(document.body)

        return () => {
            if (element) {
                annotate(element, { type: action }).remove()
                resizeObserver.disconnect()
            }
        }
    }, [
        shouldShow,
        action,
        color,
        strokeWidth,
        animationDuration,
        iterations,
        padding,
        multiline,
    ])

    return (
        <span ref={elementRef} className={`relative inline-block bg-transparent `}>
            {children}
        </span>
    )
}
