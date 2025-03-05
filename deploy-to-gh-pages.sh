#!/bin/bash

# Simple script to deploy the Staff Rota Excel to Forecasting Tool to GitHub Pages

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Error: git is not installed. Please install git and try again."
    exit 1
fi

# Check if the current directory is a git repository
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
fi

# Create a gh-pages branch if it doesn't exist
if ! git show-ref --verify --quiet refs/heads/gh-pages; then
    echo "Creating gh-pages branch..."
    git checkout -b gh-pages
else
    echo "Switching to gh-pages branch..."
    git checkout gh-pages
fi

# Add all files to git
echo "Adding files to git..."
git add .

# Commit changes
echo "Committing changes..."
git commit -m "Deploy to GitHub Pages"

# Push to GitHub (if remote is set up)
if git remote -v | grep -q "origin"; then
    echo "Pushing to GitHub..."
    git push -u origin gh-pages
else
    echo "No remote repository set up. Please set up a remote repository and push manually:"
    echo "  git remote add origin <your-github-repo-url>"
    echo "  git push -u origin gh-pages"
fi

echo "Deployment preparation complete!"
echo "Your site should be available at: https://<your-username>.github.io/<your-repo-name>/"
echo "If you haven't set up a remote repository yet, please follow the instructions above."

# Switch back to main branch if it exists
if git show-ref --verify --quiet refs/heads/main; then
    git checkout main
elif git show-ref --verify --quiet refs/heads/master; then
    git checkout master
fi

echo "Done!"
