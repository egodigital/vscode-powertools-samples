# App (vue-test)

Shows how create a button, that makes use of [Clockify API](https://clockify.me/).

## Install

Create or edit a `settings.json` inside a `.vscode` subfolder and add the following entry:

```json
{
    "ego.power-tools": {
        "buttons": [{
            "text": "Clockify",
            "color": "#ffff00",
            "action": {
                "type": "script",
                "script": "clockify_button.js",
                "options": {
                    "workspace": "My workspace name or ID",
                    "project": "My project name or ID"
                }
            }
        }]
    }
}
```

Replace `My workspace name or ID` and `My project name or ID` with the names (or IDs) of your workspace and project.

Now create a `clockify_button.js` inside the same folder and fill it with the content of [that file](https://github.com/egodigital/vscode-powertools-samples/blob/master/button-clockify/clockify_button.js).

## Setup API token

Open [My profile](https://clockify.me/user/settings) and generate a new API token, if needed:

[Clockify My profile](https://github.com/egodigital/vscode-powertools-samples/blob/master/_img/button-clockify1.gif)

The first time, you click on the button, a `clockify-token.txt` file, inside the current user's home directory will be created, where you have to save the API token to.

## Files

| Name | Description |
| ---- | ----------- |
| [clockify_button.js](https://github.com/egodigital/vscode-powertools-samples/blob/master/button-clockify/clockify_button.js) | The script file for the button. |
| [settings.json](https://github.com/egodigital/vscode-powertools-samples/blob/master/button-clockify/settings.json) | The settings (entry) for the `settings.json` file inside a `.vscode` sub folder inside a workspace. |
