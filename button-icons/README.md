# Button (icons)

Demonstrates, how to use [icons](https://octicons.github.com/) in [button](https://github.com/egodigital/vscode-powertools/wiki/Buttons#settings) labels.

The following settings create a button with [pencil](https://octicons.github.com/icon/pencil/) icon as prefix for its label.

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
