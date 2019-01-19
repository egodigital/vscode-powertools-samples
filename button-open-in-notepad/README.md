# Button (open-in-notepad)

Demonstrates, how to open the file in the active editor in `notepad`.

The example makes use of the (global) `activeFile` [placeholder](https://github.com/egodigital/vscode-powertools/wiki/Values#global-values).

```json
{
    "ego.power-tools": {
        "buttons": [
            {
                "text": "Open In Notepad",
                "action": {
                    "type": "shell",
                    "command": "\"notepad.exe\" \"${activeFile}\"",
                    "wait": false
                }
            }
        ]
    }
}
```
