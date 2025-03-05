# PowerShell script to resize images for browser extension icons
Add-Type -AssemblyName System.Drawing

function Resize-Image {
    param(
        [string]$InputFile,
        [string]$OutputFile,
        [int]$Width,
        [int]$Height
    )
    
    Write-Host "Resizing $InputFile to $Width x $Height as $OutputFile"
    
    try {
        $img = [System.Drawing.Image]::FromFile((Resolve-Path $InputFile))
        $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        
        # Set high quality resizing
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        
        # Draw the resized image
        $graphics.DrawImage($img, (New-Object System.Drawing.Rectangle(0, 0, $Width, $Height)))
        
        # Save the result
        $bitmap.Save($OutputFile, [System.Drawing.Imaging.ImageFormat]::Png)
        
        # Clean up
        $graphics.Dispose()
        $bitmap.Dispose()
        $img.Dispose()
        
        Write-Host "Successfully created $OutputFile"
    }
    catch {
        Write-Host "Error: $_"
    }
}

# Create the icons
$transparentIcon = "extension\images\Rat_transparent-.png"
$solidIcon = "extension\images\Rat-.png"

# Create icon16.png from the transparent icon
Resize-Image -InputFile $transparentIcon -OutputFile "extension\images\icon16.png" -Width 16 -Height 16

# Create icon48.png from the transparent icon
Resize-Image -InputFile $transparentIcon -OutputFile "extension\images\icon48.png" -Width 48 -Height 48

# Create icon128.png from the solid icon
Resize-Image -InputFile $solidIcon -OutputFile "extension\images\icon128.png" -Width 128 -Height 128

Write-Host "All icons have been created."
