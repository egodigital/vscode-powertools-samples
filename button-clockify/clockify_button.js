// The MIT License (MIT)
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER


/**
 * An API client for Clockify.
 */
class ClockifyApiClient {
    /**
     * Initializes a new instance of that class.
     * 
     * @param {String} token The API token.
     * @param {Object} args The script arguments.
     */
    constructor(token, args) {
        this.args = args;
        this.token = token;

        // https://github.com/mkloubert/vscode-helpers
        this.helpers = this.args
            .require('./helpers');
    }

    /**
     * Returns all workspaces.
     * 
     * @return {Promise<ClockifyWorkspace[]>} The promise with the workspaces.
     */
    async getWorkspaces() {
        const RESPONSE = await this.helpers
            .GET('https://api.clockify.me/api/workspaces/', {
                'X-Api-Key': this.token,
            });

        if (200 !== RESPONSE.code) {
            throw new Error(`Unexpected response: [${ RESPONSE.code }] '${ RESPONSE.status }'`);
        }

        // parse and convert to 'ClockifyWorkspace' obejcts.
        return JSON.parse(
            (await RESPONSE.readBody()).toString('utf8')
        ).map(ws => {
            return new ClockifyWorkspace(
                this, ws
            );
        });
    }

    /**
     * Makes a test call to the API.
     * 
     * @return {Promise<boolean>} The promise that indicates if operation was successful or not.
     */
    async test() {
        try {
            await this.getWorkspaces();

            return true;
        } catch (e) {
            return false;
        }
    }
}

/**
 * Handles a workspace.
 */
class ClockifyWorkspace {
    /**
     * Initializes a new instance of that class.
     *
     * @param {ClockifyApiClient} client The underlying client.
     * @param {Object} baseObject The base object from Clockify API.
     */
    constructor(client, baseObject) {
        this.client = client;
        this.baseObject = baseObject;
    }

    /**
     * Gets the ID of the task.
     * 
     * @return {String} The ID.
     */
    getId() {
        return this.baseObject
            .id;
    }

    /**
     * Gets the (display) name of the task.
     * 
     * @return {String} The name.
     */
    getName() {
        return this.baseObject
            .name;
    }

    /**
     * Returns all projects of that workspace.
     *
     * @return {Promise<ClockifyWorkspaceProject[]>} The promise with the list of projects.
     */
    async getProjects() {
        const RESPONSE = await this.client.helpers
            .GET('https://api.clockify.me/api/workspaces/' + encodeURIComponent(this.getId()) + '/projects/', {
                'X-Api-Key': this.client.token,
            });

        if (200 !== RESPONSE.code) {
            throw new Error(`Unexpected response: [${ RESPONSE.code }] '${ RESPONSE.status }'`);
        }

        // parse and convert to 'ClockifyWorkspaceProject' objects.
        return JSON.parse(
            (await RESPONSE.readBody()).toString('utf8')
        ).map(p => {
            return new ClockifyWorkspaceProject(
                this, p
            );
        });
    }

    /**
     * Gets the time entries of that workspace.
     *
     * @param {Boolean} [inProgress] Only return entries, which are in progress or not. Default: (false)
     * 
     * @return {Promise<ClockifyWorkspaceTimeEntry[]>} The promise with the list of entries.
     */
    async getTimeEntries(inProgress) {
        const RESPONSE = await this.client.helpers
            .GET('https://api.clockify.me/api/workspaces/' + encodeURIComponent(this.getId()) + '/timeEntries/' + (inProgress ? '/inProgress' : ''), {
                'X-Api-Key': this.client.token,
            });

        if (200 !== RESPONSE.code) {
            throw new Error(`Unexpected response: [${ RESPONSE.code }] '${ RESPONSE.status }'`);
        }

        const JSON_RESULT = (await RESPONSE.readBody()).toString('utf8');
        if (this.client.helpers.isEmptyString(JSON_RESULT)) {
            return [];
        }

        return this.client.helpers.asArray(
            JSON.parse(JSON_RESULT)
        ).map(te => {
            return new ClockifyWorkspaceTimeEntry(
                this, te
            );
        });
    }

    /**
     * Stops a running time entry.
     * 
     * @return {Promise<Boolean>} The promise that indicates if operation was successful or not.
     */
    async stopRunningTimeEntry() {
        // s. https://momentjs.com/
        const moment = this.client
            .args
            .require('moment');

        const BODY = JSON.stringify({
            'end': moment.utc().toISOString(),
        });

        const RESPONSE = await this.client.helpers
            .PUT('https://api.clockify.me/api/workspaces/' + encodeURIComponent(this.getId()) + '/timeEntries/endStarted', BODY, {
                'X-Api-Key': this.client.token,
                'Content-type': 'application/json; charset=utf-8',
            });

        return 200 === RESPONSE.code;
    }
}

/**
 * Handles a workspace project.
 */
class ClockifyWorkspaceProject {
    /**
     * Initializes a new instance of that class.
     *
     * @param {ClockifyWorkspace} workspace The underlying workspace.
     * @param {Object} baseObject The base object from Clockify API.
     */
    constructor(workspace, baseObject) {
        this.workspace = workspace;
        this.baseObject = baseObject;
    }

    /**
     * Creates a new time entry.
     * 
     * @return {Promise<Boolean>} The promise that indicates if operation was successful or not.
     */
    async createTimeEntry(title) {
        // s. https://momentjs.com/
        const moment = this.workspace
            .client
            .args
            .require('moment');

        const BODY = JSON.stringify({
            description: title,
            projectId: this.getId(),
            start: moment.utc().toISOString(),
            end: null,
            billable: true,
        });

        const RESPONSE = await this.workspace.client.helpers
            .POST('https://api.clockify.me/api/workspaces/' + encodeURIComponent(this.workspace.getId()) + '/timeEntries/', BODY, {
                'X-Api-Key': this.workspace.client.token,
                'Content-type': 'application/json; charset=utf-8',
            });

        return 201 === RESPONSE.code;
    }

    /**
     * Gets the ID of the task.
     * 
     * @return {String} The ID.
     */
    getId() {
        return this.baseObject
            .id;
    }

    /**
     * Gets the (display) name of the task.
     * 
     * @return {String} The name.
     */
    getName() {
        return this.baseObject
            .name;
    }

    /**
     * Gets the task entries of that project.
     *
     * @return {Promise<ClockifyWorkspaceProjectTask[]>} The promise with the list of tasks.
     */
    async getTasks() {
        const RESPONSE = await this.workspace.client.helpers
            .GET('https://api.clockify.me/api/workspaces/' + encodeURIComponent(this.workspace.getId()) + '/projects/' + encodeURIComponent(this.getId()) + '/tasks/', {
                'X-Api-Key': this.workspace.client.token,
            });

        if (200 !== RESPONSE.code) {
            throw new Error(`Unexpected response: [${ RESPONSE.code }] '${ RESPONSE.status }'`);
        }

        // parse and create 'ClockifyWorkspaceProjectTask' objects
        return JSON.parse(
            (await RESPONSE.readBody()).toString('utf8')
        ).map(t => {
            return new ClockifyWorkspaceProjectTask(
                this, t
            );
        });
    }

    /**
     * Gets the time entries of that project.
     *
     * @param {Boolean} [inProgress] Only return entries, which are in progress or not. Default: (false)
     * 
     * @return {Promise<ClockifyWorkspaceTimeEntry[]>} The promise with the list of entries.
     */
    async getTimeEntries(inProgress) {
        const ALL_TIME_ENTRIES = await this.workspace
            .getTimeEntries(inProgress);

        // filter by ID
        return ALL_TIME_ENTRIES.filter(te => {
            return this.workspace.client.helpers.normalizeString(
                te.baseObject.projectId
            ) === this.workspace.client.helpers.normalizeString(
                this.getId()
            );
        });
    }
}

/**
 * Handles a workspace time entry.
 */
class ClockifyWorkspaceTimeEntry {
    /**
     * Initializes a new instance of that class.
     *
     * @param {ClockifyWorkspace} workspace The underlying workspace.
     * @param {Object} baseObject The base object from Clockify API.
     */
    constructor(workspace, baseObject) {
        this.workspace = workspace;
        this.baseObject = baseObject;
    }

    /**
     * Gets the ID of the task.
     * 
     * @return {String} The ID.
     */
    getId() {
        return this.baseObject
            .id;
    }

    /**
     * Gets the (display) name of the task.
     * 
     * @return {String} The name.
     */
    getName() {
        return this.baseObject
            .name;
    }
}

/**
 * Handles a project task.
 */
class ClockifyWorkspaceProjectTask {
    /**
     * Initializes a new instance of that class.
     *
     * @param {ClockifyWorkspaceProject} project The underlying project.
     * @param {Object} baseObject The base object from Clockify API.
     */
    constructor(project, baseObject) {
        this.project = project;
        this.baseObject = baseObject;
    }

    /**
     * Gets the ID of the task.
     * 
     * @return {String} The ID.
     */
    getId() {
        return this.baseObject
            .id;
    }

    /**
     * Gets the (display) name of the task.
     * 
     * @return {String} The name.
     */
    getName() {
        return this.baseObject
            .name;
    }
}


/**
 * Tries to return a valid client.
 *
 * @param {Object} args The script arguments.
 * 
 * @return {Promise<ClockifyApiClient | false>} The client or (false) if failed.
 */
async function getClient(args) {
    // s. https://www.npmjs.com/package/fs-extra
    const fs = args.require('fs-extra');
    // s. https://github.com/mkloubert/vscode-helpers
    const helpers = args.require('./helpers');
    // s. https://nodejs.org/api/os.html
    const os = require('os');
    // s. https://nodejs.org/api/path.html
    const path = require('path');
    // s. https://code.visualstudio.com/api/references/vscode-api
    const vscode = args.require('vscode');

    try {
        // file with Clockify API token
        const CLOCKIFY_FILE = path.resolve(
            path.join(
                os.homedir(), 'clockify-token.txt'
            )
        );

        let openFile = false;

        if (!(await helpers.exists(CLOCKIFY_FILE))) {
            // does not exist => create new one

            await fs.writeFile(
                CLOCKIFY_FILE,
                '<PUT YOUR TOKEN HERE>',
                'utf8'
            );

            openFile = true;
        }

        const TOKEN = (await fs.readFile(
            CLOCKIFY_FILE, 'utf8'
        )).trim();
        if ('<PUT YOUR TOKEN HERE>' === TOKEN || '' === TOKEN) {
            // no token => open
            openFile = true;
        } else {
            const CLIENT = new ClockifyApiClient(TOKEN, args);
            
            try {
                // test, if token works ...
                await CLIENT.getWorkspaces();

                // ... yes
                return CLIENT;
            } catch (e) {
                // ... no => open token file

                openFile = true;

                vscode.window.showErrorMessage(
                    `[Clockify] Your API key seems to be invalid: '${ helpers.errorToString(e) }'`
                );
            }
        }

        if (openFile) {
            await helpers.openAndShowTextDocument(
                CLOCKIFY_FILE
            );
        }
    } catch (e) {
        vscode.window.showErrorMessage(
            helpers.errorToString(e)
        );
    }

    return false;
}


/**
 * Script entry point.
 * 
 * @param {Object} args The script arguments.
 */
exports.execute = async (args) => {
    // s. https://github.com/mkloubert/vscode-helpers
    const helpers = args.require('./helpers');
    // s. https://code.visualstudio.com/api/references/vscode-api
    const vscode = args.require('vscode');

    const BTN_COMMAND = args.button.command;
    try {
        args.button.command = undefined;  // deactivate button

        const CLIENT = await getClient(args);
        if (false === CLIENT) {
            return;
        }

        // workspace ID or name from settings
        const WORKSPACE_ID_OR_NAME = helpers.toStringSafe(
            args.options.workspace
        ).trim();
        if ('' === WORKSPACE_ID_OR_NAME) {
            vscode.window.showWarningMessage(
                `[Clockify] Please define the NAME or ID of the WORKSPACE in 'settings.json' file!`
            );

            return;
        }

        // project ID or name from settings
        const PROJECT_ID_OR_NAME = helpers.toStringSafe(
            args.options.project
        ).trim();
        if ('' === PROJECT_ID_OR_NAME) {
            vscode.window.showWarningMessage(
                `[Clockify] Please define the NAME or ID of the project in 'settings.json' file!`
            );

            return;
        }

        // find workspace by settings
        const WORKSPACE = helpers.from(
            await CLIENT.getWorkspaces()
        ).where(ws => {
            return (helpers.normalizeString(ws.getName()) === helpers.normalizeString(WORKSPACE_ID_OR_NAME)) ||
                (helpers.normalizeString(ws.getId()) === helpers.normalizeString(WORKSPACE_ID_OR_NAME));
        }).singleOrDefault(x => true, false);

        if (!WORKSPACE) {
            // workspace does not exist

            vscode.window.showWarningMessage(
                `[Clockify] WORKSPACE '${ WORKSPACE_ID_OR_NAME }' does not exist!`
            );

            return;
        }

        // find project by settings
        const PROJECT = helpers.from(
            await WORKSPACE.getProjects()
        ).where(p => {
            return (helpers.normalizeString(p.getName()) === helpers.normalizeString(PROJECT_ID_OR_NAME)) ||
                   (helpers.normalizeString(p.getId()) === helpers.normalizeString(PROJECT_ID_OR_NAME));
        }).singleOrDefault(x => true, false);

        if (!PROJECT) {
            // project does not exist

            vscode.window.showWarningMessage(
                `[Clockify] PROJECT '${ PROJECT_ID_OR_NAME }' does not exist!`
            );

            return;
        }

        const TIME_ENTRIES = await WORKSPACE.getTimeEntries(true);
        if (TIME_ENTRIES.length) {
            // stop running entry

            const YES_OR_NO = await vscode.window.showWarningMessage(
                `[Clockify] Do you want to STOP the TIME ENTRY for project '${ PROJECT.getName() }'?`,
                'HELL, NO!', 'Yes'
            );

            if ('Yes' === YES_OR_NO) {
                if (await WORKSPACE.stopRunningTimeEntry()) {
                    // succeeded

                    vscode.window.showInformationMessage(
                        `[Clockify] TIME ENTRY of project '${ PROJECT.getName() }' has been STOPPED.`
                    );
                } else {
                    // failed

                    vscode.window.showWarningMessage(
                        `[Clockify] TIME ENTRY of project '${ PROJECT.getName() }' could NOT be STOPPED!`
                    );
                }
            }
        } else {
            let initialTitle;

            // get last time entry
            const LAST_TIME_ENTRY = helpers.from(
                await WORKSPACE.getTimeEntries()
            ).select(x => {
                return x.baseObject;
            }).where(x => {
                return x.timeInterval &&
                    !helpers.isEmptyString(x.timeInterval.end);
            }).orderByDescending(x => {
                return x.timeInterval.end;
            }).thenByDescending(x => {
                return x.timeInterval.start;
            }).firstOrDefault(x => true, false);
            if (LAST_TIME_ENTRY) {
                initialTitle = LAST_TIME_ENTRY.description;
            }

            // entry title for new entry
            const TIME_ENTRY_TITLE = helpers.toStringSafe(
                await vscode.window.showInputBox({
                    ignoreFocusOut: true,
                    prompt: 'Enter The Title Of The New Time Entry',
                    validateInput: (val) => {
                        if ('' === helpers.normalizeString(val)) {
                            return 'Please enter a valid title!';
                        }
                    },
                    value: initialTitle,
                })
            ).trim();
            if ('' !== TIME_ENTRY_TITLE) {
                // create new entry

                if (await PROJECT.createTimeEntry(TIME_ENTRY_TITLE)) {
                    // succeeded

                    vscode.window.showInformationMessage(
                        `[Clockify] TIME ENTRY '${ TIME_ENTRY_TITLE }' has been CREATED for project '${ PROJECT.getName() }'.`
                    );
                } else {
                    // failed

                    vscode.window.showWarningMessage(
                        `[Clockify] TIME ENTRY '${ TIME_ENTRY_TITLE }' could NOT BE CREATED for project '${ PROJECT.getName() }'!`
                    );
                }
            }
        }
    } catch (e) {
        vscode.window.showErrorMessage(
            helpers.errorToString(e)
        );
    } finally {
        args.button.command = BTN_COMMAND;  // reactivate button
    }
};
