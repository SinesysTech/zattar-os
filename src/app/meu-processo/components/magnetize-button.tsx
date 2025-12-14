"use client"

import * as React from "react"

import { cn } from "@/lib/utils";
import { motion, useAnimation } from "framer-motion";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface MagnetizeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    particleCount?: number;
    attractRadius?: number;
}

function MagnetizeButton({
    className,
    particleCount = 12,
    ...props
}: MagnetizeButtonProps) {
    const [isAttracting, setIsAttracting] = useState(false);
    const particlesControl = useAnimation();

    // Use lazy initialization to generate particles only once
    const [particles] = useState(() =>
        Array.from({ length: particleCount }, (_, i) => ({
            id: i,
            x: Math.random() * 360 - 180,
            y: Math.random() * 360 - 180,
        }))
    );

    const handleInteractionStart = useCallback(async () => {
        setIsAttracting(true);
        await particlesControl.start({
            x: 0,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 50,
                damping: 10,
            },
        });
    }, [particlesControl]);

    const handleInteractionEnd = useCallback(async () => {
        setIsAttracting(false);
        await particlesControl.start((i) => ({
            x: particles[i].x,
            y: particles[i].y,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15,
            },
        }));
    }, [particlesControl, particles]);

    return (
        <Button
            className={cn(
                "min-w-40 relative touch-none md:overflow-visible overflow-hidden",
                "bg-[#5523eb] hover:bg-[#4a1fd4]",
                "text-white",
                "border border-[#5523eb]/30",
                "transition-all duration-300 h-12 px-6",
                "shadow-md hover:shadow-lg",
                "active:scale-95",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5523eb]/50",
                className
            )}
            onMouseEnter={handleInteractionStart}
            onMouseLeave={handleInteractionEnd}
            onTouchStart={handleInteractionStart}
            onTouchEnd={handleInteractionEnd}
            {...props}
        >
            {particles.map((_, index) => (
                <motion.div
                    key={index}
                    custom={index}
                    initial={{ x: particles[index].x, y: particles[index].y }}
                    animate={particlesControl}
                    className={cn(
                        "absolute w-1.5 h-1.5 rounded-full",
                        "bg-[#FF7A00]",
                        "transition-all duration-300",
                        isAttracting ? "opacity-70 scale-110" : "opacity-40 scale-90"
                    )}
                />
            ))}
            <span className="relative w-full flex items-center justify-center">
                Consultar
            </span>
        </Button>
    );
}

export { MagnetizeButton }