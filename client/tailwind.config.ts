import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "var(--font-sora)", "sans-serif"],
      },
      fontSize: {
        'display-2xl': ['var(--display-2xl-size)', 'var(--display-2xl-line)'],
        'display-xl': ['var(--display-xl-size)', 'var(--display-xl-line)'],
        'h1': ['var(--h1-size)', 'var(--h1-line)'],
        'h2': ['var(--h2-size)', 'var(--h2-line)'],
        'h3': ['var(--h3-size)', 'var(--h3-line)'],
        'h4': ['var(--h4-size)', 'var(--h4-line)'],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        brand: {
          50: "var(--p-brand-50)",
          100: "var(--p-brand-100)",
          200: "var(--p-brand-200)",
          300: "var(--p-brand-300)",
          400: "var(--p-brand-400)",
          500: "var(--p-brand-500)",
          600: "var(--p-brand-600)",
          700: "var(--p-brand-700)",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          border: "hsl(var(--sidebar-border))",
        },
        header: {
          DEFAULT: "hsl(var(--header-bg))",
          border: "hsl(var(--header-border))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        marqueeReverse: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        scan: {
          "0%": { top: "-10%", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { top: "110%", opacity: "0" },
        },
        springPop: {
          "0%": { opacity: "0", transform: "scale(0.8) translateY(20px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        liquidFill: {
          "0%": { backgroundPosition: "0% 100%" },
          "100%": { backgroundPosition: "0% 0%" },
        },
        drawBorder: {
          "0%": { clipPath: "inset(0 100% 100% 0)" },
          "25%": { clipPath: "inset(0 0 100% 0)" },
          "50%": { clipPath: "inset(0 0 0 0)" },
          "75%": { clipPath: "inset(0 0 0 0)" },
          "100%": { clipPath: "inset(0 0 0 0)" },
        },
        "pulse-glow": {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 20px rgba(255, 255, 255, 0.2)",
          },
          "50%": {
            opacity: ".7",
            boxShadow: "0 0 40px rgba(255, 255, 255, 0.4)",
          },
        },
        "scan-vertical": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(200%)" },
        },
        "draw-lines": {
          "0%": { strokeDasharray: "1000", strokeDashoffset: "1000", opacity: "0" },
          "100%": { strokeDashoffset: "0", opacity: "1" },
        },
        pathMove: {
          "0%": { strokeDashoffset: "100" },
          "100%": { strokeDashoffset: "0" },
        },
        flyUp: {
          "0%": { transform: "translateY(120vh) translateX(-5vw)" },
          "100%": { transform: "translateY(-120vh) translateX(5vw)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "spin-slow": "spin 60s linear infinite",
        "spin-reverse-slow": "spin 45s linear reverse infinite",
        marquee: "marquee 25s linear infinite",
        "marquee-reverse": "marqueeReverse 25s linear infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-glow": "pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        scan: "scan 3s linear infinite",
        "scan-vertical": "scan-vertical 3s linear infinite",
        "draw-lines": "draw-lines 2s ease-out forwards",
        "spring-pop": "springPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
        "liquid-fill": "liquidFill 2s ease-in-out forwards",
        "draw-border": "drawBorder 1s ease-out forwards",
        "path-move": "pathMove 3s linear infinite",
        "fly-up": "flyUp 12s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
