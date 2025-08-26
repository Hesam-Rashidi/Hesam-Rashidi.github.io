# Hesam Rashidi - Portfolio Website

A clean, responsive portfolio website showcasing research work in transportation engineering, combinatorial optimization, and AI for operations.

## 🌟 Features

- **Modern Design**: Clean, professional layout with dark theme
- **Interactive Game**: Knapsack optimization challenge with AI comparison
- **Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- **Performance Optimized**: Vanilla JavaScript, no frameworks
- **GitHub Pages Ready**: Hosted directly from this repository

## 🎮 Interactive Playground

The site includes a **Knapsack Problem** optimization game where visitors can:
- Select items to maximize value within weight constraints
- Compare their solution against an AI greedy algorithm
- Learn about combinatorial optimization interactively
- See visual feedback with color-coded value/weight ratios

## 🚀 GitHub Pages Setup

This repository is configured for GitHub Pages hosting:

1. **Enable GitHub Pages**:
   - Go to your repository Settings
   - Navigate to "Pages" in the sidebar
   - Under "Source", select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Click "Save"

2. **Access your site**:
   - Your site will be available at: `https://[username].github.io/[repository-name]`
   - For example: `https://hesam-rashidi.github.io/PersonalWebpage`

3. **Custom Domain** (optional):
   - Add a `CNAME` file with your custom domain
   - Configure DNS settings with your domain provider

## 📁 Project Structure

```
PersonalWebpage/
├── index.html              # Main HTML file
├── assets/
│   ├── css/
│   │   └── styles.css      # All styles and responsive design
│   ├── js/
│   │   ├── theme.js        # Theme management
│   │   └── knapsack.js     # Interactive optimization game
│   └── logo.png           # Site logo/favicon
└── README.md              # This file
```

## 🛠 Technologies Used

- **HTML5**: Semantic structure and accessibility
- **CSS3**: Modern styling with CSS Grid, Flexbox, and custom properties
- **Vanilla JavaScript**: Interactive functionality without dependencies
- **Canvas API**: Real-time graphics for the optimization game
- **Inter Font**: Clean, professional typography via Google Fonts

## 📱 Mobile Responsive

The site is fully responsive with:
- Flexible grid layouts
- Touch-friendly interactive elements
- Optimized canvas rendering for mobile devices
- Readable typography across all screen sizes

## 🎯 SEO & Performance

- Semantic HTML structure
- Meta tags for social media sharing
- Optimized images and assets
- Fast loading with minimal dependencies
- Accessibility considerations

## 📊 Game Features

The Knapsack Problem game includes:
- **Dynamic item generation** with randomized values and weights
- **Visual feedback** with color-coded efficiency ratios
- **AI comparison** using greedy heuristic algorithm
- **Touch support** for mobile devices
- **Keyboard shortcuts** for power users

## 🔧 Local Development

To run locally:

1. Clone the repository
2. Open `index.html` in a web browser
3. Or use a local server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js
   npx serve .
   
   # PHP
   php -S localhost:8000
   ```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ and vanilla JavaScript**
