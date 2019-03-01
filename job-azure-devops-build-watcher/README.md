# Job (azure-devops-build-watcher)

Watches for new builds in an Azure DevOps pipeline of a project.

## Setup

* API credentials:
    * create a personal access token under `https://${organizationName}.visualstudio.com/_usersSettings/tokens` and give it enough rights to access builds
    * press `F1` in Visual Studio Code
    * open global settings with `Power Tools: Global Settings`
    * select `Azure DevOps` section
    * enter your organization name, username (maybe your Active Directory username) and password there
    * save settings

Add a new [job entry](https://github.com/egodigital/vscode-powertools/wiki/Jobs) to your `settings.json` inside your `.vscode` subfolder:

```json
{
    "ego.power-tools": {
        "jobs": [
            {
                "autoStart": true,
                "name": "Azure DevOps Build Watcher",
                "description": "Checks for new builds in an Azure DevOps pipeline of a project.",
                "time": "*/10 * * * * *",
                "action": {
                    "type": "script",
                    "script": "./azure-devops-build-watcher-job.js",
                    "options": {
                        "organization": "<REPLACE-IT-WITH-YOUR-ORGANIZATION-NAME>",
                        "project": "<REPLACE-IT-WITH-THE-PROJECT-NAME>"
                    }
                }
            }
        ]
    }
}
```

Create the file `azure-devops-build-watcher-job.js` inside `.vscode` subfolder and add the following content:

```javascript
exports.execute = async (args) => {
    // s. https://lodash.com/
    const _ = args.require('lodash');
    // s. https://egodigital.github.io/vscode-powertools/api/modules/_azure_.html
    const azure = args.require('./azure');
    // s. https://egodigital.github.io/vscode-powertools/api/modules/_helpers_.html
    //    https://github.com/mkloubert/vscode-helpers
    const helpers = args.require('./helpers');
    // s. https://www.npmjs.com/package/opn
    const opn = args.require('opn');
    // s. https://code.visualstudio.com/api/references/vscode-api
    const vscode = args.require('vscode');

    if (!_.isPlainObject(args.state)) {
        args.state = {};
    }
    if (!Array.isArray(args.state.builds)) {
        args.state.builds = [];
    }

    // list of handled builds
    const HANDLED_BUILDS = args.state
        .builds;

    // from .vscode/settings.json
    const ORGANIZATION = helpers.normalizeString(args.options.organization);
    const PROJECT = helpers.toStringSafe(args.options.project)
        .trim();

    // s. https://egodigital.github.io/vscode-powertools/api/modules/_azure_.html#getazuredevopsapicredentials
    // 
    // generate a personal access token for the REST API in your user settings:
    //    https://${organizationName}.visualstudio.com/_usersSettings/tokens
    // 
    // open 'Power Tools: Global Settings' command in your editor,
    // enter your API credentials in 'Azure DevOps' section
    // and save them
    const API_CRED = azure.getAzureDevOpsAPICredentials(args.extension);

    // s. https://docs.microsoft.com/en-us/rest/api/azure/devops/build/builds/list?view=azure-devops-rest-5.0
    const RESPONSE = await helpers.GET(`https://dev.azure.com/${
        encodeURIComponent(ORGANIZATION)
    }/${
        encodeURIComponent(PROJECT)
    }/_apis/build/builds?api-version=5.0`, {
        'Authorization': 'Basic ' + API_CRED.toBase64(),
    });

    if (200 !== RESPONSE.code) {
        return;
    }

    const RESULT = JSON.parse(
        (await RESPONSE.readBody())
            .toString('utf8')
    );

    if (!Array.isArray(RESULT.value)) {
        return;
    }

    RESULT.value.forEach((build) => {
        // build => https://docs.microsoft.com/en-us/rest/api/azure/devops/build/builds/list?view=azure-devops-rest-5.0#build

        if (HANDLED_BUILDS.indexOf(build.id) > -1) {
            return;  // already handled
        }
        
        const STATUS = helpers.normalizeString(build.status);
        switch (STATUS) {
            case 'inprogress':
            case 'notstarted':
                {
                    // marked as "handled"
                    HANDLED_BUILDS.push(build.id);

                    vscode.window.showInformationMessage(
                        `[Azure DevOps] Build '${ build.buildNumber }' (# ${ build.id }) for '${ PROJECT }' has been started.\nDo you like to open it?`,
                        'Yes', 'No'
                    ).then((result) => {
                        if ('Yes' !== result) {
                            return;
                        }

                        const BROWSER_URL = `https://${
                            encodeURIComponent(ORGANIZATION)
                        }.visualstudio.com/${
                            encodeURIComponent(PROJECT)
                        }/_build/results?buildId=${
                            encodeURIComponent(build.id.toString())
                        }`;

                        opn(BROWSER_URL, {
                            wait: false,
                        }).then(() => {})
                          .catch(() => {});
                    }, (err) => {
                    });
                }
                break;
        }
    });
};
```

Maybe you have to restart your editor to apply the changes.
