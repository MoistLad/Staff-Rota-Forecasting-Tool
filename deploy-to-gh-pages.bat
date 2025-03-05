@echo off
echo Simple script to deploy the Staff Rota Excel to Forecasting Tool to GitHub Pages

REM Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: git is not installed. Please install git and try again.
    exit /b 1
)

REM Check if the current directory is a git repository
if not exist .git (
    echo Initializing git repository...
    git init
)

REM Create a gh-pages branch if it doesn't exist
git show-ref --verify --quiet refs/heads/gh-pages
if %ERRORLEVEL% neq 0 (
    echo Creating gh-pages branch...
    git checkout -b gh-pages
) else (
    echo Switching to gh-pages branch...
    git checkout gh-pages
)

REM Add all files to git
echo Adding files to git...
git add .

REM Commit changes
echo Committing changes...
git commit -m "Deploy to GitHub Pages"

REM Check if remote is set up
git remote -v | findstr "origin" >nul
if %ERRORLEVEL% equ 0 (
    echo Pushing to GitHub...
    git push -u origin gh-pages
) else (
    echo No remote repository set up. Please set up a remote repository and push manually:
    echo   git remote add origin ^<your-github-repo-url^>
    echo   git push -u origin gh-pages
)

echo Deployment preparation complete!
echo Your site should be available at: https://^<your-username^>.github.io/^<your-repo-name^>/
echo If you haven't set up a remote repository yet, please follow the instructions above.

REM Switch back to main branch if it exists
git show-ref --verify --quiet refs/heads/main
if %ERRORLEVEL% equ 0 (
    git checkout main
) else (
    git show-ref --verify --quiet refs/heads/master
    if %ERRORLEVEL% equ 0 (
        git checkout master
    )
)

echo Done!
pause
