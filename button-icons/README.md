# Button (icons)

Demonstrates, how to use [icons](https://octicons.github.com/) in [button](https://github.com/egodigital/vscode-powertools/wiki/Buttons#settings) labels.

```json
{
    "ego.power-tools": {
        "buttons": [
            {
                "text": "$(pencil)  Open In Notepad",
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
