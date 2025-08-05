import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1440px' // Updated max width
			}
		},
		extend: {
			maxWidth: {
				'app': '1440px',
			},
			spacing: {
				'app-x': '24px',
				'app-y': '40px',
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				// Good Business Brand Colors (Refined)
				'brand-blue': '#2563EB',
				'brand-green': '#059669', 
				'brand-red': '#DC2626',
				'brand-purple': '#7C3AED',
				'brand-gold': '#F59E0B',
				'brand-navy': '#0F172A',
				'text-muted': '#64748B',
				'border-muted': '#E2E8F0',
				'bg-subtle': '#F8FAFC',
				// Legacy Good Business Brand Colors
				'forest-green': 'hsl(var(--forest-green))',
				'navy-blue': 'hsl(var(--navy-blue))',
				'navy-blue-light': 'hsl(var(--navy-blue-light))',
				'indigo-purple': 'hsl(var(--indigo-purple))',
				'sky-blue': 'hsl(var(--sky-blue))',
				'golden-yellow': 'hsl(var(--golden-yellow))',
				'near-black': 'hsl(var(--near-black))',
				'off-white': 'hsl(var(--off-white))',
				'light-gray': 'hsl(var(--light-gray))',
				'timeline-gray': 'hsl(var(--timeline-gray))',
				'current-time-green': 'hsl(var(--current-time-green))',
				// Task Priority Colors
				'priority-high': 'hsl(var(--priority-high))',
				'priority-medium': 'hsl(var(--priority-medium))',
				'priority-low': 'hsl(var(--priority-low))',
				// Good Business Project Colors
				'project-navy': {
					DEFAULT: 'hsl(var(--project-navy))',
					bg: 'hsl(var(--project-navy-bg))'
				},
				'project-forest': {
					DEFAULT: 'hsl(var(--project-forest))',
					bg: 'hsl(var(--project-forest-bg))'
				},
				'project-indigo': {
					DEFAULT: 'hsl(var(--project-indigo))',
					bg: 'hsl(var(--project-indigo-bg))'
				},
				'project-sky': {
					DEFAULT: 'hsl(var(--project-sky))',
					bg: 'hsl(var(--project-sky-bg))'
				},
				'project-purple': {
					DEFAULT: 'hsl(var(--project-purple))',
					bg: 'hsl(var(--project-purple-bg))'
				},
				'project-gold': {
					DEFAULT: 'hsl(var(--project-gold))',
					bg: 'hsl(var(--project-gold-bg))'
				},
				// Calendar and Timeline Colors
				'calendar-event': {
					bg: 'hsl(var(--calendar-event-bg))',
					border: 'hsl(var(--calendar-event-border))'
				},
				'calendar-grid': 'hsl(var(--calendar-grid))',
				'current-time-line': 'hsl(var(--current-time-line))',
				// Footer Colors
				'footer': {
					bg: 'hsl(var(--footer-background))',
					foreground: 'hsl(var(--footer-foreground))',
					'accent-green': 'hsl(var(--footer-accent-green))',
					'accent-blue': 'hsl(var(--footer-accent-blue))',
					'accent-yellow': 'hsl(var(--footer-accent-yellow))'
				},
				// Sidebar Colors
				'sidebar-card': 'hsl(var(--sidebar-card-bg))',
				'sidebar-border': 'hsl(var(--sidebar-border))',
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				xl2: '1.25rem'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-card': 'var(--gradient-card)',
				'gradient-accent': 'var(--gradient-accent)',
				'gradient-ai-planned': 'var(--gradient-ai-planned)'
			},
			boxShadow: {
				'soft': 'var(--shadow-soft)',
				'elevated': 'var(--shadow-elevated)',
				'card': 'var(--shadow-card)',
				'gb-card': '0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)',
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
				"fade-in": {
					"0%": { opacity: "0", transform: "translateY(10px)" },
					"100%": { opacity: "1", transform: "translateY(0)" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"fade-in": "fade-in 0.3s ease-out",
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
