# Portfolio Website Template

A clean, responsive portfolio website template perfect for showcasing research work, projects, and interactive demonstrations. Built with vanilla JavaScript and optimized for GitHub Pages hosting.

## Features

- **Modern Design**: Clean, professional layout with automatic dark/light theme
- **Interactive Playground**: Optimization games including Shortest Path Race and Nim with a Twist
- **Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- **Performance Optimized**: Vanilla JavaScript, no frameworks or dependencies

## Interactive Playground

The site includes interactive optimization games where visitors can:
- **Shortest Path Race**: Compete against AI to find optimal routes with uncertainty
- **Nim with a Twist**: Play the classic game with a strategic rearrangement option
- Learn about algorithmic thinking and optimization interactively
- Experience decision-making under uncertainty

## GitHub Pages Setup

This repository is configured for GitHub Pages hosting:

1. **Enable GitHub Pages**:
   - Go to your repository Settings
   - Navigate to "Pages" in the sidebar
   - Under "Source", select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Click "Save"

2. **Access your site**:
   - Your site will be available at: `https://[username].github.io/[repository-name]`
   - For example: `https://yourusername.github.io/your-portfolio`

3. **Custom Domain** (optional):
   - Add a `CNAME` file with your custom domain
   - Configure DNS settings with your domain provider

## Project Structure

```
portfolio-website/
├── index.html              # Main HTML file
├── assets/
│   ├── css/
│   │   └── styles.css      # All styles and responsive design
│   ├── js/
│   │   ├── theme.js        # Theme management
│   │   ├── header.js       # Header functionality
│   │   ├── tabs.js         # Tab navigation
│   │   ├── shortestpath.js # Shortest Path Race game
│   │   ├── nim.js          # Nim with a Twist game
│   │   └── bg.js          # Background effects
│   ├── logo.png           # Site logo/favicon
│   └── resume.pdf         # Resume/CV file
├── LICENSE                # MIT license
└── README.md              # This file
```

## Local Development

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

## How to Customize

This template is designed to be easily customizable:

### Quick Start
1. **Fork this repository** to your GitHub account
2. **Rename the repository** to `[your-username].github.io` for automatic GitHub Pages hosting
3. **Enable GitHub Pages** in repository settings (see GitHub Pages Setup section above)
4. **Customize the content** following the steps below

### Customization Steps
1. **Update personal information** in `index.html`:
   - Replace name, title, bio, and contact information
   - Update social media links
   - Replace the logo image in `assets/logo.png`
   - Replace `assets/resume.pdf` with your own resume

2. **Modify the projects section**:
   - Update project descriptions, links, and tags
   - Add or remove project cards as needed

3. **Customize styling**:
   - Modify colours and fonts in `assets/css/styles.css`
   - Update the colour scheme variables at the top of the file

4. **Update metadata**:
   - Modify page title and meta descriptions in `index.html`
   - Update the LICENSE file with your name and year


## License

This project is open source and available under the [MIT License](LICENSE).
