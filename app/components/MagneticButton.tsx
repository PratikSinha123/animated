import React, { useRef, useEffect } from "react";
import gsap from "gsap";

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function MagneticButton({
  children,
  onClick,
  className = "",
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const bgGlowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    const glow = bgGlowRef.current;
    if (!button) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Magnetic pull: pull the button towards the mouse coordinates (up to 20px)
      gsap.to(button, {
        x: x * 0.35,
        y: y * 0.35,
        duration: 0.3,
        ease: "power2.out",
      });

      // Move the internal glowing blob inside the button
      if (glow) {
        gsap.to(glow, {
          x: x * 0.5,
          y: y * 0.5,
          duration: 0.2,
          ease: "power2.out",
          opacity: 1,
        });
      }
    };

    const handleMouseLeave = () => {
      // Reset button and glow to original positions
      gsap.to(button, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.4)",
      });

      if (glow) {
        gsap.to(glow, {
          x: 0,
          y: 0,
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
        });
      }
    };

    button.addEventListener("mousemove", handleMouseMove);
    button.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      button.removeEventListener("mousemove", handleMouseMove);
      button.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="relative group p-4 inline-block">
      <button
        ref={buttonRef}
        onClick={onClick}
        className={`relative z-10 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full font-medium tracking-wide flex items-center gap-2 overflow-hidden shadow-2xl transition-all duration-300 group-hover:border-white/30 backdrop-blur-sm cursor-pointer ${className}`}
      >
        {/* Glow element that follows mouse inside the button */}
        <div
          ref={bgGlowRef}
          className="absolute pointer-events-none rounded-full w-24 h-24 bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-cyan blur-xl opacity-0 transition-opacity duration-300 -translate-x-1/2 -translate-y-1/2"
          style={{ top: "50%", left: "50%" }}
        />
        
        {/* Button content */}
        <span className="relative z-20 flex items-center gap-2">
          {children}
        </span>
      </button>
    </div>
  );
}
