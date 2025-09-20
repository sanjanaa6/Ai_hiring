# AI Hiring Landing Page

This directory contains the unified landing page and components for the AI Hiring platform.

## Structure

```
landing/
├── components/           # Reusable landing page components
│   ├── LandingNavbar.js     # Navigation bar for landing page
│   ├── Hero.js              # Hero section component
│   ├── Features.js          # Features showcase
│   ├── HowItWorks.js        # Process explanation
│   ├── Testimonials.js      # Customer testimonials
│   ├── Pricing.js           # Pricing plans
│   ├── CTA.js               # Call-to-action sections
│   └── Footer.js            # Footer component
├── LandingPage.js        # Main unified landing page
├── index.js              # Export file
└── README.md             # This file
```

## Landing Page

### Main Landing Page (`/landing`)
- **Purpose**: Comprehensive overview of the AI Hiring platform
- **Audience**: All visitors (candidates, recruiters, companies)
- **Features**: Hero, features, how it works, testimonials, pricing, CTA


## Components

### Reusable Components
- **LandingNavbar**: Navigation bar with logo, menu, and auth buttons
- **Hero**: Main banner section with CTA
- **Features**: Grid of platform features with icons
- **HowItWorks**: Step-by-step process explanation
- **Testimonials**: Customer reviews and success stories
- **Pricing**: Pricing plans and add-ons
- **CTA**: Call-to-action sections
- **Footer**: Footer with links and company info

## Design Features

### Modern UI/UX
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Gradient Backgrounds**: Beautiful color gradients for visual appeal
- **Interactive Elements**: Hover effects, animations, and transitions
- **Professional Typography**: Clean, readable fonts and spacing

### Color Schemes
- **Main Landing**: Blue to Indigo gradients

### Key Features
- **Smooth Animations**: CSS transitions and hover effects
- **Interactive Testimonials**: Carousel with navigation
- **Dynamic Pricing**: Monthly/Annual toggle
- **Mobile Navigation**: Collapsible mobile menu
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Usage

### Routing
The landing page is integrated into the main App.js routing:

```javascript
// Landing Page
<Route path="/landing" element={<LandingPage />} />
```

### Navigation
- Main navigation is hidden on landing page
- Landing page has its own navigation bar
- Landing page can be accessed via the main home page

### Customization
- Colors and themes can be easily customized in each component
- Content can be updated by modifying the component files
- New landing pages can be added by creating new components and adding routes

## Dependencies

- **React**: Component framework
- **React Router**: Navigation and routing
- **Lucide React**: Icons
- **Tailwind CSS**: Styling and responsive design
- **Framer Motion**: Animations (if needed)

## Future Enhancements

- [ ] Add more interactive animations
- [ ] Implement A/B testing for different versions
- [ ] Add video backgrounds or demos
- [ ] Create more specialized landing pages
- [ ] Add analytics tracking
- [ ] Implement SEO optimization
- [ ] Add internationalization support
