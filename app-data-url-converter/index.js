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

const _ = require('lodash');
const fs = require('fs-extra');
const mime = require('mime-types');
const parseDataURL = require('data-urls');
const path = require('path');


exports.onEvent = async (args) => {
    const helpers = args.require('./helpers');
    const vscode = args.require('vscode');

    switch (args.event) {
        case 'on.command':
            switch (args.data.command) {
                case 'copyToClipboard':
                    // copy data URL to clipboard
                    {
                        try {
                            await vscode.env.clipboard.writeText(
                                helpers.toStringSafe(args.data.data)
                            );

                            vscode.window.showInformationMessage(
                                `[Data URL Converter] URL has been copied to clipboard.`
                            );
                        } catch (e) {
                            vscode.window.showErrorMessage(
                                `[Data URL Converter] Copy to clipboard failed: '${ helpers.errorToString(e) }'`
                            );
                        }
                    }
                    break;

                case 'dataURLToFile':
                    // save data URL to file
                    {
                        try {
                            const DATA_URL = parseDataURL(args.data.data.trim());

                            const FILTERS = {};

                            let mimeType = DATA_URL.mimeType.toString();
                            if (mimeType) {
                                const EXTENSION = mime.extension(mimeType);
                                if (EXTENSION) {
                                    FILTERS[`${ EXTENSION.toUpperCase() } files`] = [
                                        EXTENSION
                                    ];
                                }
                            }

                            FILTERS['All files (*.*)'] = [ '*' ];

                            const OUTPUT_FILE = await vscode.window.showSaveDialog({
                                filters: FILTERS,
                            });

                            if (OUTPUT_FILE) {
                                const OUTPUT_FILE_PATH = path.resolve(OUTPUT_FILE.fsPath);

                                await fs.writeFile(
                                    OUTPUT_FILE_PATH,
                                    DATA_URL.body
                                );

                                vscode.window.showInformationMessage(
                                    `[Data URL Converter] URL has been saved to '${ OUTPUT_FILE_PATH }'`
                                );
                            }
                        } catch (e) {
                            vscode.window.showErrorMessage(
                                `[Data URL Converter] Save to file failed: '${ helpers.errorToString(e) }'`
                            );
                        }
                    }
                    break;

                case 'fileToDataURL':
                    // create data URL from file
                    {
                        let err;
                        let url;
                        try {
                            const SELECTED_FILES = await vscode.window.showOpenDialog({
                                canSelectFiles: true,
                                canSelectFolders: false,
                                canSelectMany: false,
                            });

                            if (SELECTED_FILES && SELECTED_FILES.length) {
                                const FILE = path.resolve(
                                    SELECTED_FILES[0].fsPath
                                );

                                let type = mime.lookup(FILE);
                                if (!type) {
                                    type = 'application/octet-stream';
                                }

                                const DATA = await fs.readFile(FILE);

                                url = `data:${ type };base64,${ DATA.toString('base64') }`;
                            }
                        } catch (e) {
                            err = e;
                        }

                        await args.post(
                            'fileToDataURLFinished',
                            {
                                success: _.isNil(err),
                                url: _.isNil(err) ? url : undefined,
                                error: _.isNil(err) ? undefined : helpers.errorToString(err),
                            }
                        );
                    }
                    break;
            }
            break;
    }
};


/**
 * This returns the title, which is displayed in the tab
 * of the web view.
 */
exports.getTitle = () => {
    return "Data URL Converter";
};

/**
 * This returns the HTML code for the body.
 */
exports.getHtml = (args) => {
    return args.renderFile(
        'view.ejs'
    );
};
