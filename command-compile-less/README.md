# Command (compile-less)

Compiles [less](http://lesscss.org/) files from the file explorer or a editor's context menu.

First add the following entry to your `settings.json` file, which is inside your `.vscode` sub folder of your workspace.

```json
{
    "ego.power-tools": {
        "commands": {
            "myLessCompiler": {
                "name": "LESS compiler",
                "description": "Compiles .less files.",
                "script": "my_less_compiler.js",

                "forFile": true,
                "forFolder": true
            }
        }
    }
}
```

Now create a `my_less_compiler.js` in the same folder, with the following content:

```javascript
exports.execute = async (args) => {
    // s. https://code.visualstudio.com/api/references/vscode-api
    const vscode = args.require('vscode');

    if (args.file) {
        // single file
        if (!args.file.fsPath.endsWith('.less')) {
            vscode.window.showWarningMessage(
                'No LESS file!'
            );

            return;
        }

        await compileLESSFiles(
            args, [ args.file.fsPath ]
        );
    } else if (args.folder) {
        // folder with sub folder

        await compileLESSFiles(
            args, await scanForLessFiles(args, args.folder.fsPath)
        ); 
    }
};

/**
 * Compiles LESS files.
 * 
 * @param {Object} args Script arguments.
 * @param {Array} files The array of files to compile.
 */
async function compileLESSFiles(args, files) {
    // s. https://www.npmjs.com/package/clean-css
    const cleanCSS = args.require('clean-css');
    // s. https://www.npmjs.com/package/fs-extra
    const fs = args.require('fs-extra');
    // s. https://github.com/egodigital/vscode-powertools/blob/master/src/helpers.ts
    const helpers = args.require('./helpers');
    // s. https://www.npmjs.com/package/less
    const less = args.require('less');
    const path = require('path');
    // https://code.visualstudio.com/api/references/vscode-api
    const vscode = args.require('vscode');

    const CSS_MINIFY = new cleanCSS();

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        cancellable: true,
        title: 'LESS compiler'
    }, async (progress, cancelToken) => {
        for (const F of files) {
            if (cancelToken.isCancellationRequested) {
                return;
            }

            try {
                const LESS_FILE = path.resolve(
                    F
                );

                progress.report({
                    message: `Compiling '${ path.basename(LESS_FILE) }' ...`,
                    increment: 1 / files.length * 100.0,
                })

                const CSS_FILE = path.resolve(
                    path.join(
                        path.dirname(LESS_FILE),
                        path.basename(
                            LESS_FILE, path.extname(LESS_FILE)
                        ) + '.css'
                    )
                );
                if (await helpers.exists(CSS_FILE)) {
                    // remove old file
                    await fs.unlink(CSS_FILE);
                }

                const LESS_CONTENT = await fs.readFile(
                    LESS_FILE,
                    'utf8'
                );

                // compile
                const COMPILER_RESULT = await less.render(LESS_CONTENT);

                await fs.writeFile(
                    CSS_FILE,
                    CSS_MINIFY.minify(COMPILER_RESULT.css)
                        .styles,
                    'utf8'
                );
            } catch (e) {
                helpers.showErrorMessage(e); 
            }
        }
    });
}

/**
 * Scan for LESS files.
 * 
 * @param {Object} args Script arguments.
 * @param {String} dir The directory to scan.
 * @param {Array} [files] The array, where to store file paths in.
 * 
 * @return {Array} The list of found files.
 */
async function scanForLessFiles(args, dir, files) {
    // s. https://www.npmjs.com/package/fs-extra
    const fs = args.require('fs-extra');
    // s. https://github.com/egodigital/vscode-powertools/blob/master/src/helpers.ts
    const helpers = args.require('./helpers');
    const path = require('path');

    dir = path.resolve(dir);
    
    if (arguments.length < 3) {
        // initialize result array
        files = [];
    }

    // scan directory
    for (const ITEM of await fs.readdir(dir)) {    
        const FULL_PATH = path.resolve(
            path.join(dir, ITEM)
        );
    
        if (await helpers.isFile(FULL_PATH, false)) {
            if (FULL_PATH.endsWith('.less')) {
                // only if LESS file

                files.push(FULL_PATH);
            }    
        } else if (await helpers.isDirectory(FULL_PATH, false)) {
            // scan sub directory

            await scanForLessFiles(
                args, FULL_PATH, files
            );
        }
    }

    // sort by name
    return helpers.from(
        files
    ).orderBy(x => helpers.normalizeString(x))
     .toArray();
}
```
