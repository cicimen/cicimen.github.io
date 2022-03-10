# BetterTouchTool reset trial time 
# ** All preference will reset

echo "remove ~/Library/Preferences/com.hegenberg.BetterTouchTool.plist"
rm -rf ~/Library/Preferences/com.hegenberg.BetterTouchTool.plist
echo "Done"

echo "remove ~/Library/Application\ Support/BetterTouchTool/"
rm -rf ~/Library/Application\ Support/BetterTouchTool/
echo "Done"

echo "remove /Applications/BetterTouchTool.app"
rm -rf /Applications/BetterTouchTool.app
echo "Done"

echo "kill BetterTouchTool"
kill $(ps aux | grep 'BetterTouchTool' | awk '{print $2}')
echo "Done"

echo "uninstall BetterTouchTool"
brew uninstall --cask bettertouchtool
echo "Done"

echo "install BetterTouchTool"
brew install --cask bettertouchtool
echo "Done"

echo "open BetterTouchTool"
open -a BetterTouchTool
echo "Done"