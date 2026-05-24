$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\Audio Visualizer.lnk')
$Shortcut.TargetPath = 'c:\AI.-PROJECTS\audio-visualization-video-generator\start-app.bat'
$Shortcut.WorkingDirectory = 'c:\AI.-PROJECTS\audio-visualization-video-generator'
$Shortcut.Description = 'Audio Visualization Video Generator'
$Shortcut.Save()
